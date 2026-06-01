import Link from "next/link"
import { Package } from "lucide-react"
import { redirect } from "next/navigation"
import { getMe } from "@/lib/api/client"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getMe()
  if (user) {
    redirect("/")
  }

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
