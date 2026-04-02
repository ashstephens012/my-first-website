import Link from "next/link";

const sections = [
  {
    title: "Reports",
    description: "Generate and view monthly consulting reports for your members.",
    href: "/dashboard/reports",
    icon: (
      <svg className="h-8 w-8 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v-5.5m3 5.5V8.25m3 3v-2" />
      </svg>
    ),
  },
  {
    title: "Members",
    description: "View and manage practice members, contacts, and details.",
    href: "/dashboard/members",
    icon: (
      <svg className="h-8 w-8 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 9.35m-16.5 0a3.004 3.004 0 0 1-.621-1.097L2.008 4.5h19.984l-1.121 3.753a3.004 3.004 0 0 1-.621 1.097" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 text-center">
        <img src="/tio-logo.svg" alt="The Invisible Orthodontist" className="mx-auto mb-4 h-14" />
        <h1 className="text-3xl font-bold text-brand-navy">Member Management Portal</h1>
        <p className="mt-2 text-slate-500">Track. Report. Deliver.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-brand-navy/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-navy/5">
              {s.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-navy group-hover:text-brand-navy/80">{s.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{s.description}</p>
            </div>
            <span className="mt-auto text-sm font-medium text-brand-navy group-hover:underline">
              Go to {s.title} &rarr;
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
