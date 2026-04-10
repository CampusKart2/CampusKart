import Link from "next/link";
import CreateListingWizard from "@/components/listings/CreateListingWizard";
import { getSession } from "@/lib/auth";

export default async function SellPage() {
  const session = await getSession();

  return (
    <main className="bg-surface min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.28em]">
            Sell on CampusKart
          </p>
          <h1 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            Create your listing in three simple steps.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
            Fill out the details, add photos, and preview before you publish. Your listing will be visible to other students right away.
          </p>
        </div>

        {session ? (
          <CreateListingWizard />
        ) : (
          <div className="rounded-card border border-border bg-card p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-text-primary">Sign in to post a new listing.</p>
            <p className="mt-2 text-sm text-text-secondary">
              You need a verified Pace account to sell items on CampusKart.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-button border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary-light transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-button bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition"
              >
                Create account
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
