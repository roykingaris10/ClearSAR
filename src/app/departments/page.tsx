import { requireSessionUser } from "@/lib/require-session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { DepartmentRegistry } from "@/components/DepartmentRegistry";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const user = await requireSessionUser();

  const departments = await prisma.department.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { dataRequests: true } },
    },
  });

  const initial = departments.map((d) => ({
    id: d.id,
    name: d.name,
    contactName: d.contactName,
    contactEmail: d.contactEmail,
    dataTypes: JSON.parse(d.dataTypes) as string[],
    requestCount: d._count.dataRequests,
  }));

  return (
    <AppShell userEmail={user.email} userName={user.name ?? undefined}>
      <div className="stagger space-y-8">
        <header>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            Departments
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Register internal departments that hold personal data. ClearSAR
            recommends relevant departments per SAR and tracks data collection.
          </p>
        </header>

        <DepartmentRegistry initial={initial} />
      </div>
    </AppShell>
  );
}
