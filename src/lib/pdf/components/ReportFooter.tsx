/**
 * PDF Report Footer Component
 */

import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../styles';

export function ReportFooter() {
  const year = new Date().getFullYear();

  return (
    <View style={pdfStyles.footer} fixed>
      <Text>
        © {year} The Invisible Orthodontist
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}
