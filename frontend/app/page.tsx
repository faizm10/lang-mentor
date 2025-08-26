"use client";

import { useState } from "react";
import MentorSelection from "@/components/mentor-selection";
import MenteeRegistration, { MenteeData } from "@/components/mentee-registration";
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
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Navigation />
      </header>
      <main className="flex-1 flex flex-col min-h-0">
        {menteeData ? (
          <MentorSelection 
            menteeData={menteeData} 
            onReset={handleResetRegistration}
          />
        ) : (
          <MenteeRegistration onComplete={handleRegistrationComplete} />
        )}
      </main>
      <Toaster />
    </>
  );
}
