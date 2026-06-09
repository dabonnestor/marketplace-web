import Link from "next/link"
import { Package } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold">
          <Package className="h-6 w-6" />
          Marketplace
        </Link>
        {children}
      </div>
    </div>
  )
}
