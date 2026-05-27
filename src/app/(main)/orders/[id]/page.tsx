export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Order {id}</h1>
      <p className="text-muted-foreground">Order details coming soon.</p>
    </div>
  )
}
