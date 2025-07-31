import MentorSelection from "@/components/mentor-selection";
import Navigation from "@/components/navigation";
import { Toaster } from "sonner";

export default function Home() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Navigation />
      </header>
      <main className="flex-1 flex flex-col min-h-0">
        <MentorSelection />
      </main>
      <Toaster />
    </>
  );
}
