"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-[14px] text-accent font-medium">
        You&apos;re in! We&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
    >
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "loading"}
        className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-[14px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-accent hover:bg-accent-hover transition-colors text-white text-[14px] font-medium px-6 py-2.5 whitespace-nowrap disabled:opacity-60"
      >
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="w-full text-center text-[12px] text-red-500 -mt-1">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
