"use client";

interface LoadingStateProps {
  message?: string;
  variant?: "dots" | "skeleton";
}

export default function LoadingState({
  message = "Loading...",
  variant = "dots",
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div data-testid="loading-indicator" className="space-y-5 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-7 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-72 rounded-md skeleton-shimmer" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="loading-indicator"
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full loading-dot"
          style={{ backgroundColor: "#736278" }}
        />
        <div
          className="w-3 h-3 rounded-full loading-dot"
          style={{ backgroundColor: "#3A4F6E" }}
        />
        <div
          className="w-3 h-3 rounded-full loading-dot"
          style={{ backgroundColor: "#00508B" }}
        />
      </div>
      <p className="text-sm font-body" style={{ color: "#64748B" }}>
        {message}
      </p>
    </div>
  );
}
