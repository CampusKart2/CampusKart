import { redirect } from "next/navigation";
import VerifyEmailCard from "@/components/auth/VerifyEmailCard";
import { getSession } from "@/lib/auth";

export default async function VerifyEmailPage() {
  const session = await getSession();

  if (session?.emailVerified) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
        <VerifyEmailCard />
      </div>
    </main>
  );
}
