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
  if (me) redirect(me.role === "ADMIN" ? "/admin" : next || "/account");

  return (
    <main id="main" className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
