import SignupForm from "@/components/auth/SignupForm";

interface SignupPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { from = "/" } = await searchParams;

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-surface px-4 py-12">
      <SignupForm from={from} />
    </div>
  );
}
