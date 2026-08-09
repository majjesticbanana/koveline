import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { customTestCatalog, v2LessonMap } from "@/lib/content/loader";
import { TestBuilder } from "@/components/test-builder";
import siteCopy from "@/content/site-copy.json";

export const metadata: Metadata = {
  title: siteCopy.customTest.metaTitle,
  description: siteCopy.customTest.metaDescription,
};

export default function TestPage() {
  return (
    <main className="test-page mx-auto max-w-[820px] px-5 pb-16 pt-6">
      <Link href="/" className="mb-5 inline-flex items-center gap-1.5 text-[0.84rem] font-bold text-cocoa transition hover:text-coffee">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {siteCopy.customTest.backHome}
      </Link>
      <TestBuilder catalog={customTestCatalog()} v2LessonMap={v2LessonMap()} />
    </main>
  );
}
