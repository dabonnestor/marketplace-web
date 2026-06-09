import { DashboardNav } from "./dashboard-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row md:gap-8 gap-4">
      <DashboardNav />
      <div className="flex-1">{children}</div>
    </div>
  )
}
