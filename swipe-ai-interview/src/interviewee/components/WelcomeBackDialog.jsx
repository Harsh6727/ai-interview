import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function WelcomeBackDialog({
  welcomeOpen,
  setWelcomeOpen,
  resumeCandidateId,
  candidates,
  setFields,
  setCurrentId,
  setResumeBehavior,
  setShowTest,
}) {
  return (
    <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
      <DialogContent className='max-w-md p-0 overflow-hidden rounded-2xl shadow-xl bg-white/95 border border-yellow-200'>
        <DialogHeader className='p-0'>
          <div className='bg-gradient-to-r from-yellow-300 to-yellow-100 px-6 py-4 border-b border-yellow-200 rounded-t-2xl'>
            <DialogTitle className='text-indigo-900 text-base font-semibold'>
              Welcome back :)
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className='px-6 py-5 space-y-3'>
          <p className='text-sm text-gray-700'>
            We found an unfinished test. You can resume where you left off.
          </p>
          <p className='text-xs text-gray-600'>
            Resuming is allowed within <span className='font-medium'>5 minutes</span> of leaving.
          </p>

          <div className='flex justify-end pt-2'>
            <Button
              className='bg-indigo-600 hover:bg-indigo-700 text-white'
              onClick={() => {
                if (!resumeCandidateId) return;
                const cand = candidates.find((x) => x.id === resumeCandidateId);
                if (cand) {
                  setFields({
                    name: String(cand.name ?? '').trim(),
                    email: String(cand.email ?? '').trim(),
                    phone: String(cand.phone ?? '').trim(),
                  });
                }
                setCurrentId(resumeCandidateId);
                setResumeBehavior('auto');
                setWelcomeOpen(false);
                setShowTest(true);
              }}
            >
              Resume test
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

