"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";

const data = {
  versions: ["1.0.0"],
  navMain: [
    {
      title: "Admin",
      url: "/dashboard",
      items: [
        { title: "Home", url: "/" },
        { title: "Matching", url: "/dashboard" },
        { title: "Assignments", url: "/dashboard/assignments" },
      ],
    },
  ],
} as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar {...props}>
      <SidebarHeader className="px-3 py-3">
        <Link href="/" className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-emerald-50 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900">Mentor Matching System</span>
            <span className="text-xs text-gray-500">Admin dashboard</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((link) => (
                  <SidebarMenuItem key={link.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === link.url ||
                        (link.url !== "/dashboard" && link.url !== "/" && pathname.startsWith(link.url))
                      }
                    >
                      <a href={link.url}>{link.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
