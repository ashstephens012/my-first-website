/**
 * PDF Meetings Section Component
 * Renders individual meeting cards with summaries and actions
 */

import { View, Text } from '@react-pdf/renderer';
import { pdfStyles, colors } from '../styles';
import { format } from 'date-fns';

export interface PdfActivity {
  id: string;
  activityType: string;
  subject: string;
  date: string; // ISO string — Date objects don't survive react-pdf serialization
  participants: string | null;
  summary: string | null;
  rawContent?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface MeetingsSectionProps {
  activities: PdfActivity[];
}

function parseSummaryJson(summary: string | null): {
  summary: string;
  actions: string[];
} {
  if (!summary) return { summary: '', actions: [] };
  try {
    const parsed = JSON.parse(summary);
    return {
      summary: parsed.summary || '',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  } catch {
    return { summary: '', actions: [] };
  }
}

function parseParticipants(participants: string | null): string[] {
  if (!participants) return [];
  try {
    const parsed = JSON.parse(participants);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatOutcome(outcome: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    RESCHEDULED: 'Rescheduled',
    NO_SHOW: 'No Show',
    CANCELLED: 'Cancelled',
  };
  return labels[outcome] || outcome;
}

export function MeetingsSection({ activities }: MeetingsSectionProps) {
  const meetings = activities.filter((a) => a.activityType === 'meeting');

  if (meetings.length === 0) {
    return null;
  }

  return (
    <View style={pdfStyles.section}>
      <Text style={pdfStyles.sectionTitle}>Meetings</Text>

      {meetings.map((meeting) => {
        const { summary, actions } = parseSummaryJson(meeting.summary);
        const attendees = parseParticipants(meeting.participants);
        const outcome = (meeting.metadata as Record<string, unknown>)?.outcome as string | undefined;

        return (
          <View
            key={meeting.id}
            style={{
              marginBottom: 12,
              padding: 12,
              backgroundColor: colors.background,
              borderRadius: 4,
              borderLeft: `3pt solid ${colors.green}`,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Century Gothic', fontWeight: 700,
                color: colors.primary,
                marginBottom: 4,
              }}
            >
              {meeting.subject}
            </Text>

            <Text
              style={{
                fontSize: 9,
                color: colors.textLight,
                marginBottom: 6,
              }}
            >
              {format(new Date(meeting.date), 'd MMMM yyyy, HH:mm')}
              {outcome && `  |  ${formatOutcome(outcome)}`}
              {attendees.length > 0 && `  |  ${attendees.join(', ')}`}
            </Text>

            {summary ? (
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 1.5,
                  color: colors.text,
                  marginBottom: actions.length > 0 ? 6 : 0,
                }}
              >
                {summary}
              </Text>
            ) : null}

            {actions.length > 0 && (
              <View style={{ marginTop: 2 }}>
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: 'Century Gothic', fontWeight: 700,
                    color: colors.primary,
                    marginBottom: 3,
                  }}
                >
                  Actions:
                </Text>
                {actions.map((action, i) => (
                  <Text
                    key={i}
                    style={{
                      fontSize: 9,
                      color: colors.text,
                      paddingLeft: 8,
                      marginBottom: 2,
                    }}
                  >
                    {'\u2022'} {action}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
