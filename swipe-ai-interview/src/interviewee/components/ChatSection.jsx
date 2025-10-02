import { cn } from "@/lib/utils";
import ChatBubble from "./ChatBubble";

const ChatSection = ({ chatStage, completedInfo }) => {
  return (
    <section className="lg:col-span-5">
      <div className="space-y-4">
        <div
          className={cn(
            "transition-all duration-2000 ease-out",
            chatStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <ChatBubble>
            <p className="font-semibold">Welcome! 👋</p>
            <p className="mt-1">I’ll help you kick off your interview test.</p>
          </ChatBubble>
        </div>

        <div
          className={cn(
            "transition-all duration-2000 ease-out",
            chatStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <ChatBubble accent="purple">
            <p>
              Please upload your <strong>PDF or DOCX</strong> resume on the right. I’ll
              extract your info and get things ready.
            </p>
          </ChatBubble>
        </div>

        <div
          className={cn(
            "transition-all duration-2000 ease-out",
            chatStage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <ChatBubble>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                i
              </span>
              Your details will be shown for confirmation.
            </p>
          </ChatBubble>
        </div>

        {completedInfo && (
          <div className="transition-all duration-300 opacity-100 translate-y-0">
            <ChatBubble accent="purple">
              <p className="font-medium">Thanks for finishing the test! 🎉</p>
              <p className="mt-1">
                You can upload another resume on the right to start a new test anytime.
              </p>
            </ChatBubble>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChatSection;