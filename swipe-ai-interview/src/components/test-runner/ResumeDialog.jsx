import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ResumeDialog = ({ open, onOpenChange, onResume }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-300 to-yellow-100 px-6 py-4 border-b border-yellow-200 rounded-t-2xl">
          <DialogHeader className="m-0 p-0">
            <DialogTitle className="text-indigo-900 text-base font-semibold">Welcome back :)</DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700">We saved your test progress so you can pick up where you left off.</p>
          <p className="text-xs text-gray-600">
            You can resume within <span className="font-medium">5 minutes</span> of leaving.
          </p>
          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={onResume}>
              Resume test
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeDialog;
