import LoginForm from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from = "/" } = await searchParams;

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-surface px-4 py-12">
      <LoginForm from={from} />
    </div>
  );
}
