import VerifyEmailConfirmCard from "@/components/auth/VerifyEmailConfirmCard";

interface VerifyEmailConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailConfirmPage({
  searchParams,
}: VerifyEmailConfirmPageProps) {
  const { token = "" } = await searchParams;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_38%,_#ffffff_100%)] px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
        <VerifyEmailConfirmCard token={token} />
      </div>
    </main>
  );
}
