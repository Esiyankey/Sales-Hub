"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", Icon: Home },
  { href: "/products", label: "Products", Icon: Package },
  { href: "/sales", label: "Sales", Icon: ShoppingCart },
  { href: "/settings", label: "Settings", Icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      aria-label="Bottom navigation"
    >
      <div className="pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around px-2 py-3">
          {items.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2",
                  "min-h-[56px] text-sm font-medium",
                  isActive
                    ? "text-primary"
                    : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

