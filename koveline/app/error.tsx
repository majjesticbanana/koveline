"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-5 text-center">
      <div>
        <h1 className="text-3xl font-black">Something broke</h1>
        <p className="mt-2 text-cocoa">
          Your progress is saved on this device. Try loading the page again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-[14px] bg-teal px-6 py-3 font-extrabold text-white shadow-warm-sm transition hover:bg-teal-deep"
        >
          Reload
        </button>
      </div>
    </main>
  );
}
