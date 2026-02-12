import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <main className="mx-auto max-w-5xl px-6 py-24">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">T</div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">TIO Learning</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">Teach. Inspire. Organize.</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/courses" className="text-sm font-medium text-blue-600">Courses</Link>
            <Link href="/signin" className="text-sm px-3 py-1 rounded-md border border-transparent bg-blue-600 text-white">Sign in</Link>
          </nav>
        </header>

        <section className="rounded-2xl bg-white shadow-lg p-12 dark:bg-slate-800">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="md:flex-1">
              <h2 className="text-4xl font-extrabold leading-tight text-slate-900 dark:text-white">Welcome to the TIO Learning platform</h2>
              <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">A simple, focused learning management system for instructors and learners. Browse curated courses, enroll, and access resources — or create your own content from the instructor dashboard.</p>
              <div className="mt-6 flex gap-4">
                <Link href="/courses" className="inline-flex items-center rounded-md bg-blue-600 px-5 py-3 text-white font-medium">Explore Courses</Link>
                <Link href="/dashboard" className="inline-flex items-center rounded-md border border-slate-200 px-5 py-3 text-slate-700 dark:text-slate-200">Instructor Dashboard</Link>
              </div>
            </div>

            <div className="md:w-80 md:flex-shrink-0">
              <Image src="/hero-illustration.svg" alt="Learning illustration" width={480} height={320} className="rounded-lg object-cover" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
