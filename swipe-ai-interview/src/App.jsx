import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import IntervieweeTab from './IntervieweeTab';
import InterviewerTab from './InterviewerTab';
import { cn } from '@/lib/utils';

export default function App() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 flex flex-col items-center justify-start py-5 px-2'>
      <div className='w-full max-w-5xl rounded-3xl shadow-2xl bg-white/80 backdrop-blur-lg border border-white/30 p-0 overflow-block'>
        <Tabs defaultValue='interviewee' className='w-full'>
          <TabsList className='flex w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 rounded-t-3xl shadow-md'>
            <TabsTrigger
              value='interviewee'
              className={cn('flex-1 text-lg font-bold data-[state=active]:bg-white/90 data-[state=active]:text-indigo-700 transition-all duration-200 py-4')}
            >
              Interviewee
            </TabsTrigger>
            <TabsTrigger
              value='interviewer'
              className={cn('flex-1 text-lg font-bold data-[state=active]:bg-white/90 data-[state=active]:text-indigo-700 transition-all duration-200 py-4')}
            >
              Interviewer
            </TabsTrigger>
          </TabsList>
          <TabsContent value='interviewee' className='p-0'>
            <IntervieweeTab />
          </TabsContent>
          <TabsContent value='interviewer' className='p-0'>
            <InterviewerTab />
          </TabsContent>
        </Tabs>
      </div>
      <footer className='mt-3 text-white/80 text-sm drop-shadow-lg'>
        <span className='font-semibold'>Swipe AI Interview Assistant</span> &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}


