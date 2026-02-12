"use client";

import { useState } from "react";

export default function RequestResetPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch("/api/auth/request-reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok) setStatus("Check your email for reset instructions (if the account exists).");
      else setStatus(data?.error || "Error");
    } catch (e) {
      setStatus("Network error");
    }
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-semibold mb-4">Reset password</h1>
      <p className="text-sm text-gray-600 mb-4">Enter your account email and we'll send a reset link if the account exists.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full p-2 border rounded" />
        </div>
        {status && <div className="text-sm text-gray-700">{status}</div>}
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Request reset</button>
          <a href="/signin" className="text-sm text-blue-600">Back to sign in</a>
        </div>
      </form>
    </div>
  );
}
