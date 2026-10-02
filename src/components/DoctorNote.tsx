import { toast } from "sonner";
import { Copy } from "lucide-react";
import type { Result } from "@/content";
import { Disclosure } from "@/components/Disclosure";
import { copyText } from "@/lib/share";
import { btn } from "@/lib/ui";

interface DoctorNoteProps {
  title: string;
  result: Pick<Result, "doctorNote">;
  at: number;
  /** The note says so when an AI wrote the answer behind it. */
  ai?: boolean;
}

export function DoctorNote({ title, result, at, ai = false }: DoctorNoteProps) {
  const when = new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const text = [
    `Summary for my doctor: ${title}`,
    `Checked on ${when}`,
    "",
    ...result.doctorNote.map((l) => `- ${l}`),
    "",
    ai ? "Self-reported on 1AM, with an AI-written answer. This is not a diagnosis." : "Self-reported on 1AM. This is not a diagnosis.",
  ].join("\n");

  const copy = async () => {
    const ok = await copyText(text);
    toast(ok ? "Copied. Paste it into WhatsApp or show it at the clinic." : "Couldn't copy. Select the text and copy it by hand.");
  };

  return (
    <Disclosure title="Doctor-ready summary" summary="What to say, already written down">
      <ul className="space-y-2.5 text-body text-ink">
        {result.doctorNote.map((l, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-lamp" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={copy} className={btn("secondary", "mt-5 w-full")}>
        <Copy className="size-4" aria-hidden="true" />
        Copy summary
      </button>
    </Disclosure>
  );
}
