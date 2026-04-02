/**
 * PDF Executive Summary Component
 */

import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../styles';

interface ExecutiveSummaryProps {
  summary: string;
  emailCount: number;
  meetingCount: number;
}

export function ExecutiveSummary({
  summary,
  emailCount,
  meetingCount,
}: ExecutiveSummaryProps) {
  return (
    <View style={pdfStyles.section}>
      <Text style={pdfStyles.sectionTitle}>Executive Summary - Consulting</Text>

      <View style={pdfStyles.statsContainer}>
        <View style={pdfStyles.statBoxEmail}>
          <Text style={pdfStyles.statNumber}>{emailCount}</Text>
          <Text style={pdfStyles.statLabel}>Emails</Text>
        </View>
        <View style={pdfStyles.statBoxMeeting}>
          <Text style={pdfStyles.statNumber}>{meetingCount}</Text>
          <Text style={pdfStyles.statLabel}>Meetings</Text>
        </View>
        <View style={pdfStyles.statBoxTotal}>
          <Text style={pdfStyles.statNumber}>{emailCount + meetingCount}</Text>
          <Text style={pdfStyles.statLabel}>Total Interactions</Text>
        </View>
      </View>

      <Text style={pdfStyles.summaryText}>{summary}</Text>
    </View>
  );
}
