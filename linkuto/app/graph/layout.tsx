"use client";

import Sidebar from "@/components/Sidebar";

export default function GraphLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base overflow-hidden">
      <Sidebar />
      {/* We make it overflow-hidden so the canvas takes up the exact available screen without double scrollbars */}
      <div className="lg:ml-[260px] h-screen flex flex-col transition-all duration-400">
        {/* Top bar */}
        <header className="flex-shrink-0 z-20 bg-bg-base/80 backdrop-blur-md border-b border-border-warm">
          <div className="flex items-center justify-between px-6 lg:px-10 h-16">
            <div className="w-10 lg:hidden" />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white text-sm font-bold cursor-pointer">
                D
              </div>
            </div>
          </div>
        </header>

        {/* Page content fills remaining height */}
        <main className="flex-1 relative">{children}</main>
      </div>
    </div>
  );
}
