import { Card } from "@/components/ui/card";
import { UploadCloud, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

const UploadCard = ({ extracting, fileInputRef, onFileChange }) => {
  return (
    <section className="lg:col-span-7">
      <Card className="w-full max-w-xl p-8 bg-white/95 shadow-xl rounded-2xl flex flex-col items-center gap-4 mx-auto">
        <div className="flex items-center gap-3">
          <UploadCloud className="w-7 h-7 text-indigo-500" />
          <h2 className="text-xl font-bold text-indigo-700">Upload Your Resume</h2>
        </div>
        <p className="text-gray-600 text-sm -mt-1">
          PDF or DOCX only. We'll extract your info to start the test.
        </p>

        <label className="w-full">
          <span className="sr-only">Upload resume</span>
          <Input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.docx"
            onChange={onFileChange}
            disabled={extracting}
            className="cursor-pointer"
          />
        </label>

        <div className="w-full mt-2 text-xs text-gray-500 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          {extracting ? "Extracting...  " : "Your details will be shown for confirmation."}
        </div>
      </Card>
    </section>
  );
};

export default UploadCard;
