import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";

interface ReportButtonProps {
  onReport: (option: "notAvailable" | "notValid" | "other") => void;
  closeDrawer: () => void;
}

export default function ReportButton({
  onReport,
  closeDrawer,
}: ReportButtonProps) {
  const { showActionSheetWithOptions } = useActionSheet();

  const showReportMenu = () => {
    const options = [
      "Cancel",
      "Parking Not Available",
      "Parking Spot Not Valid",
      "Other",
    ];
    const cancelButtonIndex = 0;

    showActionSheetWithOptions(
      { options, cancelButtonIndex },
      (buttonIndex) => {
        if (buttonIndex === 1) onReport("notAvailable");
        if (buttonIndex === 2) onReport("notValid");
        if (buttonIndex === 3) onReport("other");
      }
    );
  };

  const handleReportButton = () => {
    closeDrawer();
    showReportMenu();
  };

  return (
    <View style={{ position: "absolute", bottom: 100, right: 20 }}>
      <Text onPress={handleReportButton} style={styles.reportButton}>
        <Text style={{ color: "white", fontWeight: "bold" }}>Report</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  reportButton: {
    fontSize: 20,
    color: "#e98d58",
    fontWeight: "bold",
  },
});
