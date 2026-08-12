"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  GraduationCap,
  Link2,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { title: "Matching", url: "/dashboard", icon: Workflow },
  { title: "Mentors", url: "/dashboard/mentors", icon: Users },
  { title: "Add mentor", url: "/dashboard/add-mentor", icon: UserPlus },
  { title: "Assignments", url: "/dashboard/assignments", icon: Link2 },
  { title: "Database", url: "/dashboard/database", icon: Database },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // On mobile the sidebar is a sheet — close it once a destination is picked.
  const closeOnMobile = () => setOpenMobile(false);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-3">
        <Link
          href="/dashboard"
          onClick={closeOnMobile}
          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              Mentor Matching
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Admin dashboard
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((link) => {
                const isActive =
                  link.url === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(link.url);

                return (
                  <SidebarMenuItem key={link.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.title}
                    >
                      <Link href={link.url} onClick={closeOnMobile}>
                        <link.icon aria-hidden="true" />
                        <span>{link.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to mentee site">
              <Link href="/" onClick={closeOnMobile}>
                <ArrowLeft aria-hidden="true" />
                <span>Back to mentee site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
