"use client";

import siteCopy from "@/content/site-copy.json";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{siteCopy.system.errorTitle}</h1>
        <p className="mt-2 text-cocoa">
          {siteCopy.system.errorBody}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-ctl bg-teal px-6 py-3 font-bold text-accent-ink transition hover:bg-teal-deep hover:-translate-y-px"
        >
          {siteCopy.system.reload}
        </button>
      </div>
    </main>
  );
}
