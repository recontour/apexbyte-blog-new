"use client";

import { useState } from "react";

const EXTERNAL_NAV = [
  { label: "Our Site", href: "https://www.apexbyte.co/" },
  { label: "Contact", href: "https://www.apexbyte.co/contact" },
];

export default function MobileNav({ categories = [], activeCategory }: { categories?: string[]; activeCategory?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="sm:hidden flex flex-col justify-center gap-1.25 p-1"
      >
        <span
          className={`block w-5 h-[1.5px] bg-ink transition-transform origin-center ${open ? "translate-y-[6.5px] rotate-45" : ""}`}
        />
        <span
          className={`block w-5 h-[1.5px] bg-ink transition-opacity ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`block w-5 h-[1.5px] bg-ink transition-transform origin-center ${open ? "translate-y-[-6.5px] -rotate-45" : ""}`}
        />
      </button>

      {/* Mobile drawer */}
      <div
        className={`sm:hidden fixed inset-x-0 top-14 z-40 grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-b border-border bg-white px-5 py-4 flex flex-col gap-4 shadow-md">
            {categories.map((item) => (
              <a
                key={item}
                href={`/category/${encodeURIComponent(item)}`}
                onClick={() => setOpen(false)}
                className={`text-[15px] font-medium transition-colors ${
                  item === activeCategory ? "text-accent" : "text-ink-secondary hover:text-ink"
                }`}
              >
                {item}
              </a>
            ))}
            <span className="block w-full h-px bg-border" />
            {EXTERNAL_NAV.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="text-[15px] font-medium text-ink-secondary hover:text-ink transition-colors"
              >
                {label}
              </a>
            ))}
            <a
              href="#newsletter"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex items-center justify-center text-[14px] font-medium text-white bg-accent hover:bg-accent-hover transition-colors rounded-full px-4 py-2"
            >
              Subscribe
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
