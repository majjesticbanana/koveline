import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [me, { next }] = await Promise.all([getCurrentStudent(), searchParams]);
  // Already signed in? Then this page has nothing to offer: go where they were
  // headed, or straight to the study side of the site.
  if (me) redirect(next || (me.role === "ADMIN" ? "/admin" : "/"));

  return (
    <main id="main" className="mx-auto flex min-h-[62vh] w-full max-w-md flex-col justify-center px-4 py-8 sm:px-5 sm:py-16">
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
