"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Something broke</h1>
        <p className="mt-2 text-cocoa">
          Your progress is saved on this device. Try loading the page again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-ctl bg-teal px-6 py-3 font-bold text-white transition hover:bg-teal-deep"
        >
          Reload
        </button>
      </div>
    </main>
  );
}
