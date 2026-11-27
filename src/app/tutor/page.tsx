import { Chat } from "@/components/Chat";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Tutor" };

export default function TutorPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Tutor"
        title="Ask a question"
        description="Choose a subject if you like, then describe what you're working on. The tutor guides you with hints and questions rather than handing over answers."
      />
      <div className="pt-6">
        <Chat
          mode="tutor"
          greeting={"Tell me what you're studying and your level, and we'll work through it together."}
          placeholder="For example: help me understand how recursion works"
        />
      </div>
    </div>
  );
}
