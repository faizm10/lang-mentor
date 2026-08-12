"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "register" | "select";

const STEPS: { id: Step; label: string; shortLabel: string }[] = [
  { id: "register", label: "Your details", shortLabel: "Details" },
  { id: "select", label: "Pick your mentors", shortLabel: "Mentors" },
];

interface NavigationProps {
  /** Highlights where the mentee is in the two-step flow. */
  currentStep?: Step;
}

export default function Navigation({ currentStep }: NavigationProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-none sm:gap-3"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:size-9">
            <GraduationCap className="size-4.5 sm:size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              MentorMatch
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              LSA Mentorship Program
            </span>
          </span>
        </Link>

        {activeIndex >= 0 ? (
          <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Progress">
            {STEPS.map((step, index) => {
              const isActive = index === activeIndex;
              const isComplete = index < activeIndex;

              return (
                <li key={step.id} className="flex items-center gap-1.5 sm:gap-2">
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-px w-3 sm:w-6",
                        isComplete || isActive ? "bg-primary" : "bg-border",
                      )}
                    />
                  ) : null}
                  <span
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                      isActive && "bg-brand-subtle text-brand-subtle-foreground",
                      isComplete && "text-primary",
                      !isActive && !isComplete && "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4.5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-semibold sm:size-5 sm:text-xs",
                        isActive || isComplete
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </header>
  );
}
