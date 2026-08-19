import type { ConversationMessage } from "@/conversation/types";
import { EmphasizedText } from "@/components/conversation/EmphasizedText";

export function UserMessage({ message }: { message: ConversationMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[min(36rem,calc(100%-1.5rem))] min-w-0 rounded-[22px] rounded-br-md bg-brand px-4 py-3 text-[0.98rem] leading-6 font-medium break-words text-on-primary md:px-5 md:py-3.5 md:text-base">
        <p className="whitespace-pre-wrap">
          <EmphasizedText text={message.content} />
        </p>
      </div>
    </div>
  );
}
