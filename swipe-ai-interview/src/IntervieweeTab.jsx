import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '@/store';
import { useSelector } from 'react-redux';
import { finishWithResult } from '@/store/candidatesSlice';
import { startInterview } from '@/store/interviewSlice';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import ChatSection from '@/interviewee/components/ChatSection';
import UploadCard from '@/interviewee/components/UploadCard';
import ResumeConfirmCard from '@/interviewee/components/ResumeConfirmCard';
import CompletionSummaryCard from '@/interviewee/components/CompletionSummaryCard';
import WelcomeBackDialog from '@/interviewee/components/WelcomeBackDialog';
import TestDialog from '@/interviewee/components/TestDialog';
import {
  FIVE_MIN,
  SESSION_PREFIX,
  isEmail,
  isPhone,
  toBase64,
  normalizeMcqFromResult,
} from '@/interviewee/helpers';

const stripLeadingLabel = (value, label) => {
  if (value == null) return '';
  const pattern = new RegExp('^' + label + '\\s*[:\\-]?\\s*', 'i');
  return String(value).replace(pattern, '');
};

const WHITESPACE_REGEX = /\s+/g;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_STRIP_REGEX = /[^+\d()\-\s]/g;
const PHONE_MATCH_REGEX = /\+?\d[\d()\-\s]{7,}\d/;

const sanitizeNameValue = (value) => {
  const cleaned = stripLeadingLabel(value, 'name');
  return cleaned.replace(WHITESPACE_REGEX, ' ').trim();
};

const sanitizeEmailValue = (value) => {
  const cleaned = stripLeadingLabel(value, 'email').trim();
  const match = cleaned.match(EMAIL_REGEX);
  return match ? match[0] : cleaned;
};

const sanitizePhoneValue = (value) => {
  const cleaned = stripLeadingLabel(value, 'phone');
  const kept = cleaned.replace(PHONE_STRIP_REGEX, '');
  const match = kept.match(PHONE_MATCH_REGEX);
  const candidate = match ? match[0] : kept;
  return candidate.replace(WHITESPACE_REGEX, ' ').trim();
};

const sanitizeFields = (fields) => ({
  name: sanitizeNameValue(fields?.name ?? ''),
  email: sanitizeEmailValue(fields?.email ?? ''),
  phone: sanitizePhoneValue(fields?.phone ?? ''),
});

/* PDF.js worker config */
try {
  GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
} catch {}

export default function IntervieweeTab() {
  const dispatch = useAppDispatch();
  const candidates = useSelector((state) => state.candidates.list ?? []);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fields, setFields] = useState(() => sanitizeFields({ name: '', email: '', phone: '' }));
  const cleanedFields = React.useMemo(() => sanitizeFields(fields), [fields]);
  const [alertMsg, setAlertMsg] = useState(null);
  const fileInputRef = useRef(null);
  const [currentId, setCurrentId] = useState(null);
  const [completedInfo, setCompletedInfo] = useState(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [resumeCandidateId, setResumeCandidateId] = useState(null);
  const [resumeBehavior, setResumeBehavior] = useState('prompt');

  const isValid = !!cleanedFields.name.trim() && isEmail(cleanedFields.email) && isPhone(cleanedFields.phone);

  useEffect(() => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(SESSION_PREFIX));
      let bestKey = null;
      let bestTime = 0;

      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const data = JSON.parse(raw);
        const last = Number(data?.leftAt || data?.updatedAt || 0);
        if (!last) continue;
        if (Date.now() - last <= FIVE_MIN && last > bestTime) {
          bestTime = last;
          bestKey = k;
        }
      }

      if (bestKey) {
        const candId = bestKey.replace(SESSION_PREFIX, '');
        setResumeCandidateId(candId);
        setWelcomeOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const [chatStage, setChatStage] = useState(0);
  useEffect(() => {
    let t1;
    let t2;
    let t3;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setChatStage(3);
    } else {
      t1 = setTimeout(() => setChatStage(1), 150);
      t2 = setTimeout(() => setChatStage(2), 600);
      t3 = setTimeout(() => setChatStage(3), 1100);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  async function extractTextFromFile(file) {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      let full = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        full += content.items.map((it) => it.str).join(' ') + '\n';
      }
      return full;
    }
    if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      const mammothMod = await import('mammoth/mammoth.browser.js');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammothMod.extractRawText({ arrayBuffer });
      return result.value || '';
    }
    return await file.text();
  }

  async function extractDetails(text, file) {
    const fileBase64 = await toBase64(file);
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fileBase64, mime: file.type, fileName: file.name }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = typeof data?.error === 'string' ? data.error : `extract failed: ${res.status}`;
      throw new Error(message);
    }
    return data || { name: null, email: null, phone: null };
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] ?? fileInputRef.current?.files?.[0] ?? null;
    if (!file) return;

    setExtracting(true);
    setAlertMsg(null);
    setConfirmOpen(false);

    let text = '';
    try {
      text = await extractTextFromFile(file);
      setResumeText(text);
    } catch {
      text = '';
      setResumeText('');
    }

    try {
      const { name, email, phone } = await extractDetails(text || '', file);
      const newFields = sanitizeFields({ name: name ?? '', email: email ?? '', phone: phone ?? '' });
      setFields(newFields);

      const missing = [];
      if (!newFields.name) missing.push('name');
      if (!newFields.email) missing.push('email');
      if (!newFields.phone) missing.push('phone');
      setAlertMsg(missing.length ? `${missing.join(', ')} not found. Please fill them below.` : null);

      setConfirmOpen(true);
      setCompletedInfo(null);
    } catch {
      setAlertMsg('Extraction failed. Please fill in your details.');
      setFields({ name: '', email: '', phone: '' });
      setConfirmOpen(true);
      setCompletedInfo(null);
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStart = () => {
    if (!isValid) return;

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    setCurrentId(id);
    dispatch(startInterview(id));
    setResumeBehavior('off');
    setConfirmOpen(false);
    setShowTest(true);
  };

  const handleTestFinish = (result) => {
    if (!currentId) {
      setShowTest(false);
      setResumeBehavior('prompt');
      return;
    }

    const { score, summary, mcq } = normalizeMcqFromResult(result);

    dispatch(
      finishWithResult({
        id: currentId,
        score: Number(score ?? 0),
        finalSummary: String(summary ?? ''),
        name: cleanedFields.name.trim(),
        email: cleanedFields.email.trim(),
        phone: cleanedFields.phone.trim(),
        finished: true,
        mcq,
      })
    );

    setCompletedInfo({
      candidateId: currentId,
      name: cleanedFields.name.trim(),
      email: cleanedFields.email.trim(),
      phone: cleanedFields.phone.trim(),
      score: Number(score ?? 0),
      summary: String(summary ?? ''),
    });

    setShowTest(false);
    setResumeBehavior('prompt');
  };

  const handleTestClose = () => {
    setShowTest(false);
    setResumeBehavior('prompt');
  };

  return (
    <div className='flex flex-col min-h-[600px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-b-3xl p-6 sm:p-8'>
      <div className='rounded-[24px] border border-white/40 bg-white/20 p-4 shadow-xl backdrop-blur-lg'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
          <ChatSection chatStage={chatStage} completedInfo={completedInfo} />
          <UploadCard extracting={extracting} fileInputRef={fileInputRef} onFileChange={handleFileChange} />
        </div>

        <ResumeConfirmCard
          confirmOpen={confirmOpen}
          alertMsg={alertMsg}
          fields={fields}
          setFields={setFields}
          isValid={isValid}
          extracting={extracting}
          onStart={handleStart}
        />

        <CompletionSummaryCard completedInfo={completedInfo} />
      </div>

      <WelcomeBackDialog
        welcomeOpen={welcomeOpen}
        setWelcomeOpen={setWelcomeOpen}
        resumeCandidateId={resumeCandidateId}
        candidates={candidates}
        setFields={setFields}
        setCurrentId={setCurrentId}
        setResumeBehavior={setResumeBehavior}
        setShowTest={setShowTest}
      />

      <TestDialog
        showTest={showTest}
        setShowTest={setShowTest}
        currentId={currentId}
        resumeBehavior={resumeBehavior}
        resumeText={resumeText}
        fields={cleanedFields}
        onFinish={handleTestFinish}
        onClose={handleTestClose}
      />
    </div>
  );
}