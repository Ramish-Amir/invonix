import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Container } from "lucide-react";

export default function InvoicePdf() {
  // Create styles
  const styles = StyleSheet.create({
    page: {
      flexDirection: "row",
      backgroundColor: "#E4E4E4",
    },
    section: {
      margin: 10,
      padding: 10,
      flexGrow: 1,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text>Section #1</Text>
        </View>
        <View style={styles.section}>
          <Text>Section #2</Text>
          <Text>Section #3</Text>
        </View>
      </Page>
    </Document>
  );
}
