import type { ConversionRates } from '@/types/performance-report';

interface ConversionRateCardsProps {
  rates: ConversionRates;
}

const RATE_ITEMS: { key: keyof ConversionRates; label: string; color: string; bgColor: string }[] = [
  { key: 'leadToBooking', label: 'Lead to Booking', color: 'border-brand-navy', bgColor: 'bg-[#f7f9fb]' },
  { key: 'bookingToAttendance', label: 'Booking to Attendance', color: 'border-brand-blue', bgColor: 'bg-brand-blue/20' },
  { key: 'attendanceToStart', label: 'Attendance to Start', color: 'border-brand-green', bgColor: 'bg-brand-green/20' },
  { key: 'overallLeadToStart', label: 'Overall Lead to Start', color: 'border-[#4ade80]', bgColor: 'bg-green-50' },
];

export default function ConversionRateCards({ rates }: ConversionRateCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {RATE_ITEMS.map(({ key, label, color, bgColor }) => (
        <div
          key={key}
          className={`rounded-lg p-4 border-t-2 ${color} ${bgColor}`}
        >
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div className="text-2xl font-bold text-brand-navy">
            {rates[key] !== null ? `${rates[key]}%` : 'N/A'}
          </div>
        </div>
      ))}
    </div>
  );
}
