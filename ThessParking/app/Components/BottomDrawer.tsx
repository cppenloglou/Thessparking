import React, { useRef, useMemo, useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  ActionSheetProvider,
  useActionSheet,
} from "@expo/react-native-action-sheet";

interface BottomDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onClaim: () => void;
  onReport: (option: "notAvailable" | "notValid" | "other") => void;
}

export default function BottomDrawer({
  isVisible,
  onClose,
  onClaim,
  onReport,
}: BottomDrawerProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["5%", "30%"], []);
  const { showActionSheetWithOptions } = useActionSheet();

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.snapToIndex(0); // Open the bottom sheet
    } else {
      bottomSheetRef.current?.close(); // Close the bottom sheet
      onClose(); // Close the bottom sheet
    }
  }, [isVisible]);

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
        onClose();
      }
    );
  };

  const handleReport = () => {
    onClose();
    showReportMenu();
  };

  return isVisible ? (
    <ActionSheetProvider>
      <BottomSheet
        index={1}
        snapPoints={snapPoints}
        ref={bottomSheetRef}
        onClose={onClose}
        backgroundStyle={styles.bottomSheet}
      >
        <BottomSheetView style={styles.container}>
          <Text style={styles.claimButton} onPress={onClaim}>
            Claim spot
          </Text>
          <Text style={styles.reportButton} onPress={handleReport}>
            Report a problem
          </Text>
        </BottomSheetView>
      </BottomSheet>
    </ActionSheetProvider>
  ) : null;
}

const styles = StyleSheet.create({
  drawerBackground: {
    backgroundColor: "green",
  },
  container: {
    flex: 1,
    padding: 20,
    borderRadius: 25,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  claimButton: {
    fontSize: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    shadowColor: "black",
    shadowOpacity: 90,
    fontWeight: "bold",
    color: "#53a623",
    backgroundColor: "#f5e9ce",
    borderRadius: 20,
    shadowRadius: 10,
  },
  reportButton: {
    paddingTop: 10,
    fontSize: 20,
    color: "rgba(222, 49, 99, 0.75)",
    fontWeight: "bold",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  bottomSheet: {
    backgroundColor: "#faf5e8",
  },
});
