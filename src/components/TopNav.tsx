"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function TopNav() {
  const { data: session } = useSession();

  return (
    <nav className="w-full border-b p-4 flex items-center justify-between">
      <div>
        <Link href="/" className="font-semibold">My LMS</Link>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/courses">Courses</Link>
        {session?.user ? (
          <>
            <span className="text-sm">{session.user.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="px-3 py-1 border rounded">Sign out</button>
          </>
        ) : (
          <Link href="/signin" className="px-3 py-1 border rounded">Sign in</Link>
        )}
      </div>
    </nav>
  );
}
