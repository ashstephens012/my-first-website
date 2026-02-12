"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      redirect: true,
      email,
      password,
      callbackUrl: "/dashboard",
    } as any);
    if ((res as any)?.error) setError((res as any).error);
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full p-2 border rounded" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2 items-center">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Sign in</button>
          <button type="button" onClick={() => signIn("google")} className="px-4 py-2 border rounded">Sign in with Google</button>
          <a href="/signin/request-reset" className="ml-auto text-sm text-blue-600">Forgot password?</a>
        </div>
      </form>
    </div>
  );
}
