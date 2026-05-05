import type { RoiData } from '@/types/performance-report';

interface RoiCardsProps {
  data: RoiData;
}

function formatCurrency(value: number): string {
  return `£${value.toLocaleString('en-GB')}`;
}

export default function RoiCards({ data }: RoiCardsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg p-4 border-t-2 border-brand-blue bg-brand-blue/20">
          <div className="text-xs text-gray-500 mb-1">Pipeline Value</div>
          <div className="text-2xl font-bold text-brand-navy">
            {formatCurrency(data.pipelineValue)}
          </div>
        </div>
        <div className="rounded-lg p-4 border-t-2 border-brand-green bg-brand-green/20">
          <div className="text-xs text-gray-500 mb-1">Actual Revenue</div>
          <div className="text-2xl font-bold text-brand-navy">
            {formatCurrency(data.actualRevenue)}
          </div>
        </div>
        <div className="rounded-lg p-4 border-t-2 border-brand-orange bg-brand-orange/20">
          <div className="text-xs text-gray-500 mb-1">Potential Lost Revenue</div>
          <div className="text-2xl font-bold text-brand-navy">
            {formatCurrency(data.potentialLostRevenue)}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Based on average order value of {formatCurrency(data.averageOrderValue)}
      </div>
    </div>
  );
}
