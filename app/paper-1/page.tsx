import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PaperOne } from "@/components/paper-one";

export const metadata: Metadata = {
  title: "Paper I revision",
  description:
    "Revise SSC Islam Paper I with 180 questions from the 2020 specimen and the 2021–2025 papers.",
};

export default function PaperOnePage() {
  return (
    <main className="p1-page mx-auto max-w-[820px] px-5 pb-16 pt-6">
      <Link href="/" className="p1-back">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Home
      </Link>

      <header className="p1-intro">
        <p className="p1-kicker">Paper I</p>
        <h1>Revise the real papers.</h1>
        <p className="p1-sub">
          180 questions from the 2020 specimen and the 2021–2025 papers, with the
          marking scheme for each. Rate yourself and come back to what you missed.
        </p>
      </header>

      <PaperOne />

      <p className="p1-credit">
        Questions and marking schemes are reproduced from the SSC Islam Paper I papers.
      </p>
    </main>
  );
}
