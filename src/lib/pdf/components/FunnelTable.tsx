/**
 * PDF Funnel Table Component
 * Horizontal bars with widths proportional to counts
 */

import { View, Text } from '@react-pdf/renderer';
import { colors } from '../styles';
import type { FunnelData } from '@/types/performance-report';
import { FUNNEL_STAGE_LABELS } from '@/types/performance-report';

const STAGE_COLORS: Record<string, string> = {
  LEAD: colors.primary,
  CONSULT_BOOKED: colors.blue,
  CONSULT_ATTENDED: colors.green,
  TX_STARTED: '#4ade80',
  TX_NOT_STARTED: colors.orange,
};

interface FunnelTableProps {
  data: FunnelData;
}

export function FunnelTable({ data }: FunnelTableProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={{ marginTop: 10 }}>
      {data.map((d) => {
        const barWidth = Math.max((d.count / maxCount) * 100, 2);
        return (
          <View
            key={d.stage}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                width: 140,
                fontSize: 9,
                color: colors.text,
                fontFamily: 'Century Gothic',
              }}
            >
              {FUNNEL_STAGE_LABELS[d.stage]}
            </Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: `${barWidth}%`,
                  height: 20,
                  backgroundColor: STAGE_COLORS[d.stage] || colors.primary,
                  borderRadius: 2,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Century Gothic',
                  fontWeight: 700,
                  color: colors.text,
                  marginLeft: 8,
                }}
              >
                {d.count}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
