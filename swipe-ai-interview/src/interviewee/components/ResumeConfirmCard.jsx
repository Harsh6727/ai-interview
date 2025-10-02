import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, PlayCircle } from "lucide-react";

const ResumeConfirmCard = ({
  confirmOpen,
  alertMsg,
  fields,
  setFields,
  isValid,
  extracting,
  onStart,
}) => {
  const handlePhoneChange = (event) => {
    const raw = event.target.value;
    const cleaned = raw.replace(/[^+\d()\-\s]/g, "");
    setFields((prev) => ({ ...prev, phone: cleaned }));
  };

  return (
    <div
      className={cn(
        "mt-6 transition-all",
        confirmOpen ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1"
      )}
    >
      {confirmOpen && (
        <div
          className="
                mx-auto w-full max-w-[1100px] rounded-2xl border border-yellow-200 bg-white/95 shadow-xl
                overflow-hidden
              "
        >
          <div className="bg-gradient-to-r from-yellow-300 to-yellow-100 px-6 py-4 border-b border-yellow-200">
            <h3 className="text-indigo-900 text-base font-semibold">Confirm your details</h3>
          </div>

          <div className="px-6 py-5 space-y-4">
            {alertMsg && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
                {alertMsg}
              </div>
            )}

            <div className="grid gap-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Full name
              </label>
              <Input
                value={fields.name}
                onChange={(event) => setFields((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Your full name"
              />

              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                Email
              </label>
              <Input
                type="email"
                value={fields.email}
                onChange={(event) => setFields((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="name@example.com"
              />

              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-500" />
                Phone
              </label>
              <Input
                type="tel"
                inputMode="tel"
                value={fields.phone}
                onChange={handlePhoneChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="px-6 pb-6">
            <Button
              className={cn(
                "w-full font-semibold shadow-sm",
                isValid
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              )}
              disabled={!isValid || extracting}
              onClick={onStart}
            >
              <PlayCircle className="w-4 h-4 mr-1" />
              Start Test
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeConfirmCard;
