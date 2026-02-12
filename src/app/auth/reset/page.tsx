"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params?.get("token") || "";
  const email = params?.get("email") || "";

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) setStatus("Missing token or email");
  }, [token, email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch("/api/auth/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, email, password }) });
      const data = await res.json();
      if (res.ok) {
        setStatus("Password reset. Redirecting to sign-in...");
        setTimeout(() => router.push("/signin"), 1200);
      } else setStatus(data?.error || "Error");
    } catch (e) {
      setStatus("Network error");
    }
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>
      <p className="text-sm text-gray-600 mb-4">Enter a new secure password for your account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">New password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full p-2 border rounded" />
        </div>
        {status && <div className="text-sm text-gray-700">{status}</div>}
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Set password</button>
          <a href="/signin" className="text-sm text-blue-600">Back to sign in</a>
        </div>
      </form>
    </div>
  );
}
