import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <Package className="h-16 w-16 mb-6 text-muted-foreground" />
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Welcome to Marketplace
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Buy and sell goods in your community. Browse listings or create your
        own.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/listings">Browse Listings</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/register">Get Started</Link>
        </Button>
      </div>
    </div>
  )
}
