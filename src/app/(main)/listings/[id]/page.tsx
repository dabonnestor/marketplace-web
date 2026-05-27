export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Listing {id}</h1>
      <p className="text-muted-foreground">Listing details coming soon.</p>
    </div>
  )
}
