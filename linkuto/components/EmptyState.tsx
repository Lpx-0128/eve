"use client";

import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "Nothing here yet",
  message = "Data will appear here once available.",
  action,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="p-4 bg-accent/5 rounded-2xl mb-5">
        <Inbox size={36} className="text-accent/40" />
      </div>
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-muted font-body max-w-sm mb-6">{message}</p>
      {action}
    </div>
  );
}
