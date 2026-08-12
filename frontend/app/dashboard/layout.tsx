"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "sonner";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Matching",
  "/dashboard/mentors": "Mentors",
  "/dashboard/add-mentor": "Add mentor",
  "/dashboard/assignments": "Assignments",
  "/dashboard/database": "Database",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Sticky header — also the only way to open the sidebar on mobile. */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:h-16 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-4"
          />
          <h1 className="truncate text-sm font-semibold sm:text-base">
            {title}
          </h1>
        </header>
        <div className="flex flex-1 flex-col bg-muted/40">{children}</div>
      </SidebarInset>
      <Toaster position="top-center" richColors closeButton />
    </SidebarProvider>
  );
}
