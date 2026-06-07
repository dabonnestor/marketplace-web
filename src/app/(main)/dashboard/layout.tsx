import { redirect } from "next/navigation"
import { getCurrentUser } from "@/actions/auth"
import { DashboardNav } from "./dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-8 gap-4">
      <DashboardNav />
      <div className="flex-1">{children}</div>
    </div>
  )
}
