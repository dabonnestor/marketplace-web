export function NoImage({ className }: { className?: string }) {
  return (
    <div
      className={`bg-muted flex items-center justify-center ${className ?? ""}`}
    >
      <span className="text-muted-foreground text-sm">No image</span>
    </div>
  )
}
