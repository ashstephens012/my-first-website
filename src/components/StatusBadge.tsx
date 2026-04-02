/**
 * Status Badge Component
 * Visual indicator for report status
 */

interface StatusBadgeProps {
  status: 'draft' | 'reviewed' | 'sent';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    draft: 'bg-brand-orange/40 text-brand-navy border-brand-orange',
    reviewed: 'bg-brand-blue/40 text-brand-navy border-brand-blue',
    sent: 'bg-brand-green/40 text-brand-navy border-brand-green',
  };

  const labels = {
    draft: 'Draft',
    reviewed: 'Reviewed',
    sent: 'Sent',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
