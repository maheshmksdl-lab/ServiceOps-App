import JobDetail from "@/components/jobs/JobDetail";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetail jobId={Number(id)} />;
}
