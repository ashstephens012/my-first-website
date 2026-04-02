/**
 * PDF Styling Constants
 * Consistent branding and typography for PDF reports
 */

import { StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

const fontsDir = path.join(process.cwd(), 'src', 'lib', 'pdf', 'fonts');

Font.register({
  family: 'Century Gothic',
  fonts: [
    { src: path.join(fontsDir, 'CenturyGothic-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'CenturyGothic-Bold.ttf'), fontWeight: 700 },
  ],
});

export const colors = {
  primary: '#192845', // Brand Navy
  blue: '#bce1eb', // Brand Blue
  green: '#cedad6', // Brand Green
  orange: '#fad8ad', // Brand Orange
  pink: '#f8d1c4', // Brand Pink
  text: '#192845',
  textLight: '#64748b',
  border: '#e2e8f0',
  background: '#f7f9fb',
  white: '#ffffff',
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Century Gothic',
    color: colors.text,
    backgroundColor: colors.white,
  },

  // Header styles
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Century Gothic',
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
  },

  // Member info styles
  memberInfo: {
    marginTop: 10,
    padding: 15,
    backgroundColor: colors.background,
    borderRadius: 4,
    borderLeft: `3pt solid ${colors.blue}`,
  },
  memberName: {
    fontSize: 14,
    fontFamily: 'Century Gothic',
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 3,
  },
  memberEmail: {
    fontSize: 10,
    color: colors.textLight,
  },

  // Executive summary styles
  section: {
    marginTop: 25,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Century Gothic',
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `1pt solid ${colors.border}`,
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: colors.text,
    textAlign: 'justify',
  },

  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 20,
    gap: 20,
  },
  statBox: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 4,
    alignItems: 'center',
  },
  statBoxEmail: {
    flex: 1,
    padding: 12,
    backgroundColor: '#eef6f9',
    borderRadius: 4,
    alignItems: 'center',
    borderTop: `3pt solid ${colors.blue}`,
  },
  statBoxMeeting: {
    flex: 1,
    padding: 12,
    backgroundColor: '#eef0ed',
    borderRadius: 4,
    alignItems: 'center',
    borderTop: `3pt solid ${colors.green}`,
  },
  statBoxTotal: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 4,
    alignItems: 'center',
    borderTop: `3pt solid ${colors.primary}`,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Century Gothic',
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textLight,
    textTransform: 'uppercase',
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTop: `1pt solid ${colors.primary}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: colors.textLight,
  },

  // Empty state
  emptyState: {
    padding: 30,
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 11,
  },
});
