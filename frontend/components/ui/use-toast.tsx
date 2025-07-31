"use client";

import { toast as sonnerToast } from "sonner";

interface ToastProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const toast = ({ title, description, action, duration = 4000 }: ToastProps) => {
  sonnerToast.custom((t) => (
    <div className="w-full rounded-lg border bg-background px-4 py-3 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              sonnerToast.dismiss(t);
            }}
            className="text-sm font-medium text-primary hover:underline ml-auto"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  ), {
    duration,
  });
};