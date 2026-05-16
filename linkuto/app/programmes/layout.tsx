"use client";

import Sidebar from "@/components/Sidebar";

export default function ProgrammesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar />

      {/* Main content area — pushed right by sidebar */}
      <div className="lg:ml-[260px] transition-all duration-400">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-bg-base/80 backdrop-blur-md border-b border-border-warm">
          <div className="flex items-center justify-between px-6 lg:px-10 h-16">
            {/* Spacer for mobile hamburger */}
            <div className="w-10 lg:hidden" />
            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search programmes..."
                  className="hidden sm:block w-48 lg:w-64 px-4 py-2 text-sm rounded-xl border border-border-warm bg-card-bg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-text-primary placeholder:text-text-muted"
                />
              </div>

              {/* User avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity">
                D
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-6 lg:px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
