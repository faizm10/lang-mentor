"use client";

import { useState } from "react";
import MentorSelection from "@/components/mentor-selection";
import AdminDashboard from "@/components/admin-dashboard";
import Navigation from "@/components/navigation";
import { Toaster } from "sonner";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [currentView, setCurrentView] = useState<"mentor" | "admin">("mentor");

  const handleViewChange = (view: "mentor" | "admin") => {
    setCurrentView(view);
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Navigation
            currentView={currentView}
            onViewChange={handleViewChange}
          />
          
      </header>
      <main className="flex-1 flex flex-col min-h-0">
        <MentorSelection />
      </main>

      <Toaster />
    </>
  );
}
