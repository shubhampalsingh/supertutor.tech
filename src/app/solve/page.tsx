import { Chat } from "@/components/Chat";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Solve from a photo" };

export default function SolvePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Problem solver"
        title="Solve from a photo"
        description="Attach a photo of a problem, or type it out. You'll get a numbered walkthrough and can ask follow-up questions."
      />
      <div className="pt-6">
        <Chat
          mode="solve"
          allowSubjects={false}
          greeting={"Attach a photo of a maths, science or language problem, or type it below."}
          placeholder="Attach a photo, or type the problem"
        />
      </div>
    </div>
  );
}
