"use client";

import { useChat } from "@ai-sdk/react";
import { FormEvent, useState } from "react";

const EXAMPLE =
  "What is today's date, and are there any concerts near Boston 02115 today?";
const SUGGESTIONS = [
  "Concerts near Boston 02115 this weekend",
  "Live music within 10 miles of Austin 78701 tomorrow",
];

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s|]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("http")) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, clearError } = useChat();

  const busy = status === "submitted" || status === "streaming";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    clearError();
    setInput("");
    await sendMessage({ text });
  }

  function useExample() {
    setInput(EXAMPLE);
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-32 pt-6 sm:px-6 sm:pt-10">
        <header className="mb-10 border-b border-[var(--line)] pb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="grid size-10 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-5"
                >
                  <path d="M9 18V5l10-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="16" cy="16" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Live music nearby
                </p>
                <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                  Concert Finder
                </h1>
              </div>
            </div>
            <span className="hidden rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] sm:inline-flex">
              25 mile radius
            </span>
          </div>
          <p className="mt-5 max-w-xl text-[0.98rem] leading-7 text-[var(--muted)]">
            Tell us a city, ZIP code, and date. The agent searches venues
            around that ZIP, including nearby neighborhoods and cities.
          </p>
        </header>

        <section
          className="flex flex-1 flex-col gap-5"
          aria-live="polite"
          aria-busy={busy}
        >
          {messages.length === 0 && (
            <div className="py-4">
              <p className="text-sm font-medium text-[var(--ink)]">
                Where do you want to go out?
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Start with an example or write your own search below.
              </p>
              <div className="mt-5 flex flex-col items-start gap-2.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-left text-sm font-medium transition-colors duration-200 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <span>{suggestion}</span>
                    <span
                      aria-hidden="true"
                      className="text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]"
                    >
                      →
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={useExample}
                className="mt-5 text-sm font-medium text-[var(--accent)] underline decoration-[var(--accent-soft-strong)] underline-offset-4 hover:decoration-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
              >
                Use the full class example
              </button>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[var(--ink)] px-4 py-3 text-sm text-[var(--canvas)] shadow-sm"
                  : "mr-auto max-w-[92%] border-b border-[var(--line)] pb-5 text-sm text-[var(--ink)]"
              }
            >
              <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] opacity-60">
                {message.role === "user" ? "You" : "Concert agent"}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return <div key={i}>{linkify(part.text)}</div>;
                  }
                  if (part.type === "tool-getCurrentTime") {
                    const done = part.state === "output-available";
                    return (
                      <div
                        key={i}
                        className="my-3 flex items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]"
                      >
                        <span className="size-1.5 rounded-full bg-[var(--accent)]" />
                        {done ? "Checked current time" : "Checking time…"}
                      </div>
                    );
                  }
                  if (part.type === "tool-searchConcerts") {
                    const done = part.state === "output-available";
                    return (
                      <div
                        key={i}
                        className="my-3 flex items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]"
                      >
                        <span className="size-1.5 rounded-full bg-[var(--accent)]" />
                        {done
                          ? "Searched nearby Ticketmaster venues"
                          : "Searching a 25 mile radius…"}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <span className="size-2 animate-pulse rounded-full bg-[var(--accent)]" />
              Looking up nearby concerts…
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-[var(--error-line)] bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error)]">
              {error.message ||
                "Something went wrong. Check that your API keys are set."}
            </p>
          )}
        </section>

        <form
          onSubmit={onSubmit}
          className="fixed inset-x-0 bottom-0 border-t border-[var(--line)] bg-[var(--canvas)]"
        >
          <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6">
            <label htmlFor="concert-search" className="sr-only">
              Ask the concert finder
            </label>
            <div className="flex gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 shadow-[0_8px_30px_oklch(0.25_0.02_40/0.08)] focus-within:border-[var(--accent)]">
              <input
                id="concert-search"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-light)]"
                value={input}
                placeholder="Concerts near Boston 02115 this weekend"
                onChange={(e) => setInput(e.currentTarget.value)}
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] transition-colors duration-200 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Search
              </button>
            </div>
            <p className="mt-2 text-center text-[0.68rem] text-[var(--muted-light)]">
              Results come from Ticketmaster and may not include every venue.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
