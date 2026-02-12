import Protected from '@/components/Protected';

export default function DashboardPage() {
  return (
    <Protected>
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-2xl font-semibold">Learner Dashboard</h1>
        <p className="mt-4 text-gray-600">Your enrolled courses and progress will appear here.</p>
      </div>
    </Protected>
  );
}
