"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function PortalNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/portal") return pathname === "/portal";
    return pathname?.startsWith(href);
  }

  const linkClass = (href: string) =>
    `${isActive(href) ? "text-white" : "text-white/70"} hover:text-white`;

  return (
    <nav className="w-full bg-brand-navy p-4 flex items-center justify-between">
      <Link href="/portal" className="flex items-center gap-3">
        <img src="/tio-logo-white.png" alt="TIO" className="h-7" />
        <div className="w-px h-5 bg-white/30" />
        <span className="font-semibold text-white font-heading">Member Portal</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/portal" className={linkClass("/portal")}>Home</Link>
        <Link href="/portal/case-starts" className={linkClass("/portal/case-starts")}>Case Starts</Link>
        <Link href="/portal/marketing-plan" className={linkClass("/portal/marketing-plan")}>Marketing Plan</Link>
        {session?.user?.portalTier !== 2 && (
          <Link href="/portal/reports" className={linkClass("/portal/reports")}>Reports</Link>
        )}
        {session?.user && (
          <>
            <span className="text-sm text-white/70">{session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-1 border border-white/30 text-white hover:bg-white/10 rounded"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
