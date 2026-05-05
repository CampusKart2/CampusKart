"use client";

import { FormEvent, useEffect, useState } from "react";

interface ReportedListing {
  listing_id: string;
  title: string;
  report_count: number;
  last_reported: string;
}

interface RecentReport {
  id: string;
  listing_title: string;
  reporter_email: string | null;
  reason: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default function AdminPage() {
  const [email, setEmail] = useState("ss63231n@pace.edu");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportedListings, setReportedListings] = useState<ReportedListing[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [reportsResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/reports"),
        fetch("/api/admin/users"),
      ]);

      if (reportsResponse.status === 401 || usersResponse.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!reportsResponse.ok || !usersResponse.ok) {
        setError("Unable to load admin dashboard.");
        return;
      }

      const reportsData = (await reportsResponse.json()) as {
        reportedListings: ReportedListing[];
        recentReports: RecentReport[];
      };
      const usersData = (await usersResponse.json()) as { users: AdminUser[] };

      setReportedListings(reportsData.reportedListings);
      setRecentReports(reportsData.recentReports);
      setUsers(usersData.users);
      setAuthenticated(true);
    } catch {
      setError("Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Invalid admin credentials.");
        return;
      }

      setPassword("");
      setAuthenticated(true);
      await loadDashboard();
    } catch {
      setError("Admin login failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function removeListing(id: string) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/listings/${id}/remove`, {
        method: "PATCH",
      });

      if (!response.ok) {
        setError("Failed to remove listing.");
        return;
      }

      await loadDashboard();
    } catch {
      setError("Failed to remove listing.");
    } finally {
      setPending(false);
    }
  }

  async function deactivateUser(id: string) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${id}/deactivate`, {
        method: "PATCH",
      });

      if (!response.ok) {
        setError("Failed to deactivate user.");
        return;
      }

      await loadDashboard();
    } catch {
      setError("Failed to deactivate user.");
    } finally {
      setPending(false);
    }
  }

  async function activateUser(id: string) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${id}/activate`, {
        method: "PATCH",
      });

      if (!response.ok) {
        setError("Failed to activate user.");
        return;
      }

      await loadDashboard();
    } catch {
      setError("Failed to activate user.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-surface px-4 py-10">
        <p className="mx-auto max-w-6xl text-sm text-text-secondary">
          Loading admin...
        </p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-surface px-4 py-10">
        <form
          onSubmit={handleLogin}
          className="mx-auto w-full max-w-sm rounded-card bg-card p-8 shadow-card space-y-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Admin Login
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Use the approved admin account.
            </p>
          </div>

          {error && (
            <p className="rounded-input border border-danger/20 bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-text-primary">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-button bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-surface px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Lightweight moderation tools for CampusKart.
          </p>
        </div>

        {error && (
          <p className="rounded-input border border-danger/20 bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">
            Reported Listings
          </h2>
          <div className="overflow-x-auto rounded-card border border-border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Listing title</th>
                  <th className="px-4 py-3">Report count</th>
                  <th className="px-4 py-3">Last reported</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportedListings.map((listing) => (
                  <tr key={listing.listing_id}>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {listing.title}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {listing.report_count}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(listing.last_reported)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void removeListing(listing.listing_id)}
                        className="rounded-button bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {reportedListings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">
                      No reported listings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">All Users</h2>
          <div className="overflow-x-auto rounded-card border border-border bg-card">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {user.full_name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {user.email_verified ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {user.is_active ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          user.is_active
                            ? void deactivateUser(user.id)
                            : void activateUser(user.id)
                        }
                        className={[
                          "rounded-button px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60",
                          user.is_active ? "bg-danger" : "bg-primary",
                        ].join(" ")}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">
            Recent Reports
          </h2>
          <div className="overflow-x-auto rounded-card border border-border bg-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Reporter email</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {report.listing_title}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {report.reporter_email ?? "Deleted user"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{report.reason}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(report.created_at)}
                    </td>
                  </tr>
                ))}
                {recentReports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">
                      No reports yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
