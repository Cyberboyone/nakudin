import Link from "next/link";
import {
  getAdminStats,
  getRecentMessagesForAdmin,
  getTopProjects,
  getDepartmentAnalytics,
  getUniqueViews24h,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [stats, recentMessages, topProjects, deptAnalytics, unique24h] =
    await Promise.all([
      getAdminStats(),
      getRecentMessagesForAdmin(6),
      getTopProjects(10),
      getDepartmentAnalytics(),
      getUniqueViews24h(),
    ]);

  const cards = [
    {
      label: "Published",
      value: stats.projects.published,
      sub: `${stats.projects.drafts} drafts`,
    },
    {
      label: "Total views",
      value: stats.projects.totalViews.toLocaleString(),
      sub: `${unique24h} unique (24h)`,
    },
    {
      label: "Downloads",
      value: stats.projects.totalDownloads.toLocaleString(),
    },
    {
      label: "Unread messages",
      value: stats.messages.unread,
      sub: `${stats.messages.total} total`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl">Dashboard</h1>
        <Link
          href="/admin/projects/new"
          className="bg-lamp text-ink px-4 py-2 text-sm font-medium transition hover:brightness-110"
        >
          Add project
        </Link>
      </div>

      <section className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} sub={c.sub} />
        ))}
      </section>

      {/* Top projects by views */}
      <section className="mb-12">
        <h2 className="font-display text-lg mb-4">Top projects by views</h2>
        {topProjects.length === 0 ? (
          <p className="py-6 text-sm text-muted">No published projects yet.</p>
        ) : (
          <div className="border-y border-border divide-y divide-border">
            {topProjects.map((p, i) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="text-muted mr-2">{i + 1}.</span>
                    <Link
                      href={`/project/${p.slug}`}
                      className="hover:text-lamp transition-colors truncate"
                    >
                      {p.title}
                    </Link>
                  </p>
                  <p className="text-xs text-muted mt-0.5">{p.departmentName}</p>
                </div>
                <div className="text-right text-xs text-muted whitespace-nowrap">
                  {p.viewCount.toLocaleString()} views · {p.downloadCount.toLocaleString()} downloads
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Department breakdown */}
      <section className="mb-12">
        <h2 className="font-display text-lg mb-4">By department</h2>
        {deptAnalytics.length === 0 ? (
          <p className="py-6 text-sm text-muted">No departments yet.</p>
        ) : (
          <div className="border-y border-border divide-y divide-border">
            {deptAnalytics.map((d) => (
              <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                <Link
                  href={`/admin/projects?department=${d.slug}`}
                  className="text-sm hover:text-lamp transition-colors truncate"
                >
                  {d.name}
                </Link>
                <div className="text-right text-xs text-muted whitespace-nowrap">
                  {d.projectCount} projects · {d.totalViews.toLocaleString()} views · {d.totalDownloads.toLocaleString()} downloads
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Recent messages</h2>
          <Link
            href="/admin/messages"
            className="text-sm text-muted transition-colors hover:text-text"
          >
            View all →
          </Link>
        </div>

        {recentMessages.length === 0 ? (
          <p className="py-6 text-sm text-muted">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {recentMessages.map((m) => (
              <li key={m.id} className="py-4">
                <p className="text-sm">
                  {m.name || "Anonymous"}
                  {" — "}
                  <span className="text-muted">
                    {m.kind === "service" ? "Service request" : "Message"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted line-clamp-2">{m.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(m.createdAt).toLocaleString()}
                  {!m.isRead && <span className="ml-2 text-lamp">Unread</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
