"use client";

import { useState } from "react";
import MentorSelection from "@/components/mentor-selection";
import MenteeRegistration, {
  MenteeData,
} from "@/components/mentee-registration";
import Navigation from "@/components/navigation";
import { Toaster } from "sonner";

export default function Home() {
  const [menteeData, setMenteeData] = useState<MenteeData | null>(null);

  const handleRegistrationComplete = (data: MenteeData) => {
    setMenteeData(data);
  };

  const handleResetRegistration = () => {
    setMenteeData(null);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <Navigation currentStep={menteeData ? "select" : "register"} />
      <main className="flex flex-1 flex-col">
        {menteeData ? (
          <MentorSelection
            menteeData={menteeData}
            onReset={handleResetRegistration}
          />
        ) : (
          <MenteeRegistration onComplete={handleRegistrationComplete} />
        )}
      </main>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
