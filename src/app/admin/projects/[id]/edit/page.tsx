import { notFound } from "next/navigation";
import { getProjectByIdForAdmin } from "@/lib/queries";
import EditProjectForm from "@/components/admin/EditProjectForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectByIdForAdmin(id);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl mb-8">Edit project</h1>
      <EditProjectForm
        project={{
          id: project.id,
          title: project.title,
          departmentName: project.departmentName,
          year: project.year,
          level: project.level,
          abstract: project.abstract,
          tags: project.tags.join(", "),
          isSoftware: project.isSoftware,
          status: project.status,
        }}
      />
    </div>
  );
}
