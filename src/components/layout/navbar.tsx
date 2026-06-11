"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuthStore } from "@/stores/auth-store"
import { logout } from "@/lib/api/actions"
import { useAction } from "@/hooks/use-action"
import { Menu, Package, Plus, User } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

export function Navbar() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  const { mutate: handleLogout } = useAction(() => logout(), {
    successMessage: "Signed out",
    onSuccess: () => {
      useAuthStore.getState().setUser(null)
      router.push("/")
    },
  })

  const navLinks = user
    ? [
        { href: "/dashboard/purchases", label: "My Purchases" },
        { href: "/dashboard/sales", label: "My Sales" },
        { href: "/dashboard/listings", label: "My Listings" },
      ]
    : []

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-5 w-5" />
          Marketplace
        </Link>

        {/* Mobile: hamburger + theme */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          {!isLoading && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>
                    {user ? user.name : "Menu"}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 mt-4">
                  {user ? (
                    <>
                      <Button variant="outline" asChild className="justify-start">
                        <Link href="/listings/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Sell
                        </Link>
                      </Button>
                      {navLinks.map((link) => (
                        <Button
                          key={link.href}
                          variant="ghost"
                          asChild
                          className="justify-start"
                        >
                          <Link href={link.href}>{link.label}</Link>
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => handleLogout()}
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" asChild className="justify-start">
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button asChild className="justify-start">
                        <Link href="/register">Sign Up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Desktop: full nav */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {!isLoading && (
            user ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/listings/new">
                    <Plus className="h-4 w-4 mr-1" />
                    Sell
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm font-medium truncate">
                      {user.name}
                    </div>
                    <DropdownMenuSeparator />
                    {navLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href}>{link.label}</Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleLogout()}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  )
}
