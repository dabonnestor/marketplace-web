import { redirect } from "next/navigation"
import { getMe } from "@/lib/api/client"
import { DashboardNav } from "./dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await getMe()
    if (!user) {
      redirect("/login")
    }
  } catch {
    redirect("/login")
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-8 gap-4">
      <DashboardNav />
      <div className="flex-1">{children}</div>
    </div>
  )
}
