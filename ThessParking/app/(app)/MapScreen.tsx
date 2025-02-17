import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import { IconButton } from "react-native-paper";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import CreatePointButton from "../Components/CreatePointButton";
import BottomDrawer from "../Components/BottomDrawer";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mapStyle from "../../assets/mapStyle.json";

// Define the type for a marker object
type MarkerType = {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  notAvailableCount: number;
  notValidCount: number;
  user: string;
};

export default function MapScreen() {
  const { logout } = useAuth();

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [region, setRegion] = useState<Region | undefined>(undefined); // ✅ Fixed null issue
  const [isNearMarker, setIsNearMarker] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mapCustomStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];
  // Request Location Permission & Get User Location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable location permissions in settings."
        );
        return;
      }
      setHasLocationPermission(true);

      // Get user's current location
      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.04, // More zoomed in
        longitudeDelta: 0.04,
      });
    })();
  }, []);

  useEffect(() => {
    if (isNearMarker) {
      setIsDrawerOpen(true);
    }
  }, [isNearMarker]);

  useEffect(() => {
    const updateUserLocation = async () => {
      if (!hasLocationPermission) return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let isUserNear = false;

      markers.forEach((marker) => {
        const distance = getDistance(
          latitude,
          longitude,
          marker.latitude,
          marker.longitude
        );
        if (distance <= 0.002) {
          // ✅ 2 meters threshold (converted to km)
          isUserNear = true;
        }
      });

      if (isUserNear) {
        findClosestPoint(latitude, longitude);
        setIsDrawerOpen(true); // 🔹 Open the drawer when near a marker
      }

      setIsNearMarker(isUserNear);
    };

    // Run initially and then every 800ms
    updateUserLocation();
    const interval = setInterval(updateUserLocation, 800);

    return () => clearInterval(interval);
  }, [markers, hasLocationPermission]); // 🔹 Re-run when markers change

  // 🔥 Listen for real-time inserts, deletes, and updates from Firestore
  // useEffect(() => {
  //   const unsubscribe = onSnapshot(collection(FIRESTORE_DB, 'Points'), (querySnapshot) => {
  //     querySnapshot.docChanges().forEach((change: DocumentChange) => {
  //       const doc = change.doc;
  //       const newMarker: MarkerType = {
  //         id: doc.id,
  //         latitude: doc.data().coordinates.latitude,
  //         longitude: doc.data().coordinates.longitude,
  //         status: doc.data().status,
  //         notAvailableCount: doc.data().notAvailableCount,
  //         notValidCount: doc.data().notValidCount,
  //         user: doc.data().user
  //       };

  //       setMarkers(prevMarkers => {
  //         if (change.type === 'added') {
  //           return [...prevMarkers, newMarker]; // 🔹 Insert new marker
  //         } else if (change.type === 'modified') {
  //           return prevMarkers.map(marker => marker.id === doc.id ? newMarker : marker); // 🔹 Update marker
  //         } else if (change.type === 'removed') {
  //           return prevMarkers.filter(marker => marker.id !== doc.id); // 🔹 Delete marker
  //         }
  //         return prevMarkers;
  //       });
  //     });
  //   });

  //   // Cleanup listener on unmount
  //   return () => unsubscribe();
  // }, []);

  // const handleSignOut = async () => {
  //   try {
  //     await FIREBASE_AUTH.signOut();
  //   } catch (error) {
  //     console.error("Error signing out:", error);
  //   }
  // };

  // Function to handle reporting
  const handleReport = async (
    option: "notAvailable" | "notValid" | "other"
  ) => {
    if (!selectedMarker) {
      Alert.alert("Error", "No marker selected!");
      return;
    } else {
      // try {
      //     const markerRef = doc(FIRESTORE_DB, "Points", (selectedMarker as MarkerType).id);
      //     if (option === "notAvailable") {
      //       await updateDoc(markerRef, { notAvailableCount: (selectedMarker as MarkerType).notAvailableCount + 1 });
      //     } else if (option === "notValid") {
      //       await updateDoc(markerRef, { notValidCount: (selectedMarker as MarkerType).notValidCount + 1 });
      //     }
      //     Alert.alert("Report Submitted", "Thank you for your feedback!");
      //   } catch (error) {
      //     console.error("Error reporting marker: ", error);
      //     Alert.alert("Error", "Could not submit the report.");
      //   }
    }
  };

  // Function to add a new marker
  const handleAddMarker = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const newMarker = {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }, // Example position
        notAvailableCount: 0,
        notValidCount: 0,
        status: "active",
        user: "testUser",
      };

      // await addDoc(collection(FIRESTORE_DB, 'Points'), newMarker);
      Alert.alert("Success", "New marker added!");
    } catch (error) {
      console.error("Error adding marker: ", error);
    }
  };

  // Function to calculate the distance between two coordinates (Haversine formula)
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findClosestPoint = (latitude: number, longitude: number) => {
    // Find the closest marker
    let closestMarker: MarkerType | null = null;
    let minDistance = Number.MAX_VALUE;

    markers.forEach((marker) => {
      const distance = getDistance(
        latitude,
        longitude,
        marker.latitude,
        marker.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestMarker = marker;
      }
    });
    setSelectedMarker(closestMarker);
  };

  // Function to claim (delete) the nearest marker
  const handleClaimMarker = async () => {
    try {
      // Get user's current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      if (markers.length === 0) {
        Alert.alert("No markers available", "There are no markers to claim.");
        return;
      } else {
        // if(selectedMarker)
        //     await deleteDoc(doc(FIRESTORE_DB, "Points", (selectedMarker as MarkerType).id ));

        // // Remove it from local state
        // setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== (selectedMarker as unknown as MarkerType).id));
        // setIsDrawerOpen(false);

        Alert.alert("Marker Claimed!", "The closest marker has been deleted.");
      }
    } catch (error) {
      console.error("Error claiming marker: ", error);
      Alert.alert("Error", "Could not claim the marker.");
    }
  };

  const mapProps = {
    style: StyleSheet.absoluteFill,
    region: region,
    showsUserLocation: hasLocationPermission,
    userLocationUpdateInterval: 1000,
    customMapStyle: mapStyle,
    followsUserLocation: true,
  };

  if (Platform.OS === "web") {
    mapProps.googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    mapProps.provider = "google";
  } else {
    mapProps.provider = PROVIDER_GOOGLE;
  }

  return (
    <ActionSheetProvider>
      <GestureHandlerRootView style={styles.container}>
        <View style={StyleSheet.absoluteFill}>
          <MapView {...mapProps}>
            {markers.map((marker) => (
              <Marker
                key={`${marker.id}-${marker.status}`}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={`Status: ${marker.status}`}
                description={`Not Available: ${marker.notAvailableCount}, Not Valid: ${marker.notValidCount}`}
                anchor={{ x: 0.5, y: 1 }} // Adjust the anchor to the bottom center of the image
                calloutAnchor={{ x: 0.5, y: 0 }} // Adjust the callout anchor
              >
                <View style={styles.markerContainer}>
                  <Image
                    source={require("../../assets/images/parking_small.png")}
                    style={{ width: 32, height: 32 }}
                  />
                </View>
              </Marker>
            ))}
          </MapView>

          <CreatePointButton onPress={handleAddMarker} />
          {/* <Button title="Sign Out" onPress={handleSignOut} /> */}
          <IconButton
            icon="logout"
            size={24}
            onPress={logout}
            style={styles.iconButton}
          />
          <BottomDrawer
            isVisible={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onClaim={handleClaimMarker}
            onReport={handleReport}
          />
        </View>
      </GestureHandlerRootView>
    </ActionSheetProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 50,
    padding: 5,
    elevation: 3,
  },
});
