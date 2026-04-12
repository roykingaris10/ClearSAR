import { requireSessionUser } from "@/lib/require-session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { TemplateEditor } from "@/components/TemplateEditor";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await requireSessionUser();
  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell userEmail={user.email} userName={user.name ?? undefined}>
      <div className="stagger space-y-8">
        <header>
          <div className="stat-label">Templates</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">
            Your approved responses.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-muted">
            Edit the templates Claude uses when drafting your SAR responses.
            Use{" "}
            <code className="rounded bg-azure-50 px-1.5 py-0.5 text-azure-700">
              {"{{placeholder}}"}
            </code>{" "}
            markers for variables like{" "}
            <code className="rounded bg-azure-50 px-1.5 py-0.5 text-azure-700">
              {"{{requester_name}}"}
            </code>
            .
          </p>
        </header>

        <TemplateEditor
          initial={templates.map((t) => ({
            id: t.id,
            name: t.name,
            type: t.type,
            subject: t.subject,
            body: t.body,
          }))}
        />
      </div>
    </AppShell>
  );
}
