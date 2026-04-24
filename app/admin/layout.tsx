"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Posts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="2" width="14" height="2.5" rx="1" fill="currentColor" />
        <rect x="1" y="6.75" width="10" height="2.5" rx="1" fill="currentColor" />
        <rect x="1" y="11.5" width="7" height="2.5" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/admin/new",
    label: "New Post",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/avatar",
    label: "Avatars",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2 13.5c0-2.485 2.686-4.5 6-4.5s6 2.015 6 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/admin/login");
  }

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileNavOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
              active
                ? "bg-accent/10 text-accent"
                : "text-ink-secondary hover:bg-surface hover:text-ink"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface flex">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden sm:flex flex-col w-56 shrink-0 border-r border-border bg-white px-4 py-6 sticky top-0 h-screen">
        <Link
          href="/"
          className="text-[16px] font-semibold tracking-tight text-ink mb-8 block"
        >
          Apex<span className="text-accent">Byte</span>
          <span className="ml-2 text-[10px] font-semibold tracking-widest uppercase text-muted align-middle">
            Admin
          </span>
        </Link>

        {navLinks}

        <div className="mt-auto pt-6 border-t border-border">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted hover:text-ink hover:bg-surface transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-[16px] font-semibold tracking-tight text-ink">
          Apex<span className="text-accent">Byte</span>
          <span className="ml-2 text-[10px] font-semibold tracking-widest uppercase text-muted align-middle">
            Admin
          </span>
        </Link>
        <button
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileNavOpen((o) => !o)}
          className="flex flex-col justify-center gap-1.25 p-1"
        >
          <span className={`block w-5 h-[1.5px] bg-ink transition-transform origin-center ${mobileNavOpen ? "translate-y-[6.5px] rotate-45" : ""}`} />
          <span className={`block w-5 h-[1.5px] bg-ink transition-opacity ${mobileNavOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-[1.5px] bg-ink transition-transform origin-center ${mobileNavOpen ? "translate-y-[-6.5px] -rotate-45" : ""}`} />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileNavOpen && (
        <div className="sm:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setMobileNavOpen(false)}>
          <div
            className="absolute top-14 left-0 bottom-0 w-56 bg-white border-r border-border px-4 py-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks}
            <div className="mt-auto pt-6 border-t border-border">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted hover:text-ink hover:bg-surface transition-colors disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 min-w-0 sm:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
