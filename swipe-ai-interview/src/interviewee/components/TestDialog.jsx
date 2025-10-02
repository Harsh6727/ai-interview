import { Dialog, DialogContent } from '@/components/ui/dialog';
import TestRunner from '@/components/TestRunner';

export default function TestDialog({
  showTest,
  setShowTest,
  currentId,
  resumeBehavior,
  resumeText,
  fields,
  onFinish,
  onClose,
}) {
  return (
    <Dialog open={showTest} onOpenChange={setShowTest}>
      <DialogContent className='max-w-3xl w-[95vw] max-h-[90vh] p-0 overflow-hidden'>
        {currentId && (
          <TestRunner
            role='full-stack (React/Node)'
            resumeText={resumeText}
            resumeBehavior={resumeBehavior}
            candidateId={currentId}
            name={fields.name}
            email={fields.email}
            phone={fields.phone}
            onFinish={onFinish}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

