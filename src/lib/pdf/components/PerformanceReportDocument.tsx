/**
 * PDF Performance Report Document Component
 * Two-page document: summary + funnel on page 1, stats on page 2
 */

import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, colors } from '../styles';
import { FunnelTable } from './FunnelTable';
import { ReportFooter } from './ReportFooter';
import type { FunnelData, ConversionRates, RoiData } from '@/types/performance-report';
import path from 'path';

const whiteLogoPath = path.join(process.cwd(), 'public', 'tio-logo-white.png');

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface PerformanceReportDocumentProps {
  memberName: string;
  memberEmail: string;
  year: number;
  month: number;
  generatedAt: Date;
  summary: string;
  funnelData: FunnelData;
  conversionRates: ConversionRates;
  roiData: RoiData;
  logoUrl?: string | null;
}

function formatCurrency(value: number): string {
  return `£${value.toLocaleString('en-GB')}`;
}

export function PerformanceReportDocument({
  memberName,
  memberEmail,
  year,
  month,
  generatedAt,
  summary,
  funnelData,
  conversionRates,
  roiData,
  logoUrl,
}: PerformanceReportDocumentProps) {
  const monthYear = `${MONTH_NAMES[month]} ${year}`;
  const generatedDate = generatedAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rateItems: { label: string; value: number | null; color: string }[] = [
    { label: 'Lead to Booking', value: conversionRates.leadToBooking, color: colors.primary },
    { label: 'Booking to Attendance', value: conversionRates.bookingToAttendance, color: colors.blue },
    { label: 'Attendance to Start', value: conversionRates.attendanceToStart, color: colors.green },
    { label: 'Overall Lead to Start', value: conversionRates.overallLeadToStart, color: '#4ade80' },
  ];

  return (
    <Document>
      {/* Page 1: Header, Summary, Funnel */}
      <Page size="A4" style={pdfStyles.page}>
        {/* Navy header bar */}
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
                fontFamily: 'Century Gothic',
                fontWeight: 700,
                color: colors.white,
                marginBottom: 3,
              }}
            >
              Practice Performance Report
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              {monthYear}
            </Text>
          </View>
        </View>

        {/* Member info */}
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

        {/* Executive Summary */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Executive Summary</Text>
          <Text style={pdfStyles.summaryText}>{summary}</Text>
        </View>

        {/* Patient Journey Funnel */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Patient Journey Funnel</Text>
          <FunnelTable data={funnelData} />
        </View>

        <ReportFooter />
      </Page>

      {/* Page 2: Conversion Rates, Revenue & ROI */}
      <Page size="A4" style={pdfStyles.page}>
        {/* Conversion Rates */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Conversion Rates</Text>
          <View style={pdfStyles.statsContainer}>
            {rateItems.map((item) => (
              <View
                key={item.label}
                style={{
                  ...pdfStyles.statBox,
                  borderTop: `3pt solid ${item.color}`,
                }}
              >
                <Text style={pdfStyles.statNumber}>
                  {item.value !== null ? `${item.value}%` : 'N/A'}
                </Text>
                <Text style={pdfStyles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Revenue & ROI */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Revenue &amp; ROI</Text>
          <View style={pdfStyles.statsContainer}>
            <View
              style={{
                ...pdfStyles.statBox,
                borderTop: `3pt solid ${colors.blue}`,
                backgroundColor: '#eef6f9',
              }}
            >
              <Text style={pdfStyles.statNumber}>
                {formatCurrency(roiData.pipelineValue)}
              </Text>
              <Text style={pdfStyles.statLabel}>Pipeline Value</Text>
            </View>
            <View
              style={{
                ...pdfStyles.statBox,
                borderTop: `3pt solid ${colors.green}`,
                backgroundColor: '#eef0ed',
              }}
            >
              <Text style={pdfStyles.statNumber}>
                {formatCurrency(roiData.actualRevenue)}
              </Text>
              <Text style={pdfStyles.statLabel}>Actual Revenue</Text>
            </View>
            <View
              style={{
                ...pdfStyles.statBox,
                borderTop: `3pt solid ${colors.orange}`,
                backgroundColor: '#fef3e2',
              }}
            >
              <Text style={pdfStyles.statNumber}>
                {formatCurrency(roiData.potentialLostRevenue)}
              </Text>
              <Text style={pdfStyles.statLabel}>Potential Lost Revenue</Text>
            </View>
          </View>

          <Text style={{ fontSize: 9, color: colors.textLight, marginTop: 5 }}>
            Based on average order value of {formatCurrency(roiData.averageOrderValue)}
          </Text>
        </View>

        <ReportFooter />
      </Page>
    </Document>
  );
}
