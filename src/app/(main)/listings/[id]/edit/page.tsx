export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Listing {id}</h1>
      <p className="text-muted-foreground">Edit listing form coming soon.</p>
    </div>
  )
}
