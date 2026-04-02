/**
 * PDF Report Header Component
 */

import { View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles } from '../styles';
import { colors } from '../styles';
import { format } from 'date-fns';
import path from 'path';

interface ReportHeaderProps {
  memberName: string;
  memberEmail: string;
  reportMonth: Date;
  generatedAt: Date;
  logoUrl?: string | null;
}

const whiteLogoPath = path.join(process.cwd(), 'public', 'tio-logo-white.png');

export function ReportHeader({
  memberName,
  memberEmail,
  reportMonth,
  generatedAt,
  logoUrl,
}: ReportHeaderProps) {
  const monthYear = format(reportMonth, 'MMMM yyyy');
  const generatedDate = format(generatedAt, 'MMMM d, yyyy');

  return (
    <View style={pdfStyles.header}>
      {/* Navy header bar - negative margins to extend full width over page padding */}
      <View
        style={{
          backgroundColor: colors.primary,
          marginTop: -40,
          marginLeft: -40,
          marginRight: -40,
          paddingHorizontal: 40,
          paddingVertical: 20,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Image
          src={whiteLogoPath}
          style={{ width: 55, height: 38, objectFit: 'contain' }}
        />
        <View
          style={{
            width: 1,
            height: 30,
            backgroundColor: 'rgba(255,255,255,0.3)',
            marginHorizontal: 15,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 22,
              fontFamily: 'Century Gothic', fontWeight: 700,
              color: colors.white,
              marginBottom: 3,
            }}
          >
            Monthly Consulting Report
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            {monthYear}
          </Text>
        </View>
      </View>

      {/* Member info below the bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
        <View style={{ ...pdfStyles.memberInfo, flex: 1, marginTop: 0 }}>
          <Text style={pdfStyles.memberName}>{memberName}</Text>
          <Text style={pdfStyles.memberEmail}>{memberEmail}</Text>
        </View>
        {logoUrl && (
          <Image
            src={logoUrl}
            style={{ width: 50, height: 50, objectFit: 'contain', marginLeft: 15 }}
          />
        )}
      </View>

      <Text style={{ fontSize: 8, color: colors.textLight, marginTop: 8 }}>
        Generated on {generatedDate}
      </Text>
    </View>
  );
}
