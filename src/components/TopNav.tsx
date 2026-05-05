"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Hide TopNav on portal routes (portal has its own nav)
  if (pathname?.startsWith("/portal")) return null;

  return (
    <nav className="w-full bg-brand-navy p-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <img src="/tio-logo-white.png" alt="TIO" className="h-7" />
        <div className="w-px h-5 bg-white/30" />
        <span className="font-semibold text-white font-heading">Member Management Portal</span>
      </Link>
      <div className="flex items-center gap-4">
        {session?.user?.role === "LEADERSHIP" && (
          <Link href="/leadership" className="text-white/80 hover:text-white">Leadership</Link>
        )}
        <Link href="/dashboard" className="text-white/80 hover:text-white">Home</Link>
        <Link href="/dashboard/reports" className="text-white/80 hover:text-white">Reports</Link>
        <Link href="/dashboard/performance" className="text-white/80 hover:text-white">Performance</Link>
        <Link href="/dashboard/members" className="text-white/80 hover:text-white">Members</Link>
        <Link href="/dashboard/users" className="text-white/80 hover:text-white">Users</Link>
        {session?.user ? (
          <>
            <span className="text-sm text-white/70">{session.user.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="px-3 py-1 border border-white/30 text-white hover:bg-white/10 rounded">Sign out</button>
          </>
        ) : (
          <Link href="/signin" className="px-3 py-1 bg-white text-brand-navy rounded font-medium">Sign in</Link>
        )}
      </div>
    </nav>
  );
}
