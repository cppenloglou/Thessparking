import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect, useMemo } from "react";
import { IconButton } from "react-native-paper";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import CreatePointButton from "../Components/CreatePointButton";
import BottomDrawer from "../Components/BottomDrawer";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mapStyle from "../../assets/mapStyle.json";
import { Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "../tokenHandling";
import axios from "axios";

// Define the type for a marker object
type MarkerType = {
  latitude: number;
  longitude: number;
  status: string;
  action: string;
};

export default function MapScreen() {
  const { logout } = useAuth();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: 40.6401,
    longitude: 22.9444,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });
  const [isNearMarker, setIsNearMarker] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddPressed, setIsAddPressed] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Please enable location permissions in settings."
          );
          return;
        }
        setHasLocationPermission(true);

        // Get initial location with high accuracy
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log("CURRENT LOCATION", location);

        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        });
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        setIsLoading(false);
        setIsAddPressed(false);
      }
    })();
  }, []);

  useEffect(() => {
    setIsDrawerOpen(isNearMarker);
  }, [isNearMarker]);

  useEffect(() => {
    if (!hasLocationPermission) return;

    const updateUserLocation = async () => {
      let isUserNear = false;

      try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Use balanced accuracy for updates
          });

          setRegion((prev) => {
            // Only update if position has changed significantly
            if (
              !prev ||
              Math.abs(prev.latitude - location.coords.latitude) > 0.0001 ||
              Math.abs(prev.longitude - location.coords.longitude) > 0.0001
            ) {
              return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta,
              };
            }
            return prev;
          });

          // Check for nearby markers
          markers.forEach((marker) => {
            const distance = getDistance(
              location.coords.latitude,
              location.coords.longitude,
              marker.latitude,
              marker.longitude
            );
            if (distance <= 0.004) {
              isUserNear = true;
              findClosestPoint(
                location.coords.latitude,
                location.coords.longitude
              );
            }
          });

        setIsNearMarker(isUserNear);
      } catch (error) {
        console.error("Error updating location:", error);
      }
    };
    // const interval = setInterval(updateUserLocation, 800);
    updateUserLocation().catch((error) => console.error(error));
  }, [markers, hasLocationPermission,]);

  useEffect(() => {
    setInterval(async() => {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Use balanced accuracy for updates
      });

      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta
      });
    }, 5);
  }, []);

  let stompClient: any = null;
  let markersList: any[] = [];
  let bearerToken: string | null | undefined;

  const connect = async () => {
    console.log("Connecting to WebSocket with Bearer token...");
    const socket = new SockJS(`${process.env.EXPO_PUBLIC_API}ws`);
    stompClient = Stomp.over(socket);
    bearerToken = await getToken("accessToken");
    const headers = { Authorization: `Bearer ${bearerToken}` };
    stompClient.connect(headers, onConnected, onError);
  };

  function onConnected(): void {
    console.log("WebSocket connection established");
    stompClient.subscribe("/topic/nearby-markers", onMarkersReceived);
    stompClient.subscribe("/topic/markers", onMarkerUpdated);
    requestNearbyMarkers();
  }

  function onError(error: any): void {
    console.error("WebSocket connection failed:", error);
  }

  const requestNearbyMarkers = async () => {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const temp_reg = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };

    const locationRequest = {
      latitude: temp_reg.latitude,
      longitude: temp_reg.longitude,
    };

    stompClient.send(
      "/app/markers",
      { Authorization: `Bearer ${bearerToken}` },
      JSON.stringify(locationRequest)
    );
  };

  function onMarkersReceived(message: any): void {
    try {
      markersList = JSON.parse(message.body);
      setMarkers(markersList);
    } catch (e) {
      console.error("Error parsing markers:", e);
    }
  }

  function onMarkerUpdated(message: any): void {
    try {
      JSON.parse(message.body);
      requestNearbyMarkers();
    } catch (e) {
      console.error("Error parsing marker update:", e);
    }
  }

  useEffect(() => {
    connect();
  }, []);

  // Function to handle reporting
  const handleReport = async (
    option: "notAvailable" | "notValid" | "other"
  ) => {
    if (!selectedMarker) {
      Alert.alert("Error", "No marker selected!");
      return;
    } else {
      try {
        const reportRequest = {
          latitude: (selectedMarker as MarkerType).latitude,
          longitude: (selectedMarker as MarkerType).longitude,
          reportType: "",
        };

        if (option === "notAvailable") {
          reportRequest.reportType = "NOT_AVAILABLE";
        } else if (option === "notValid") {
          reportRequest.reportType = "NOT_VALID";
        }

        axios.post(
          process.env.EXPO_PUBLIC_API + "api/v1/markers/report",
          reportRequest,
          {
            headers: {
              Authorization: `Bearer ${await getToken("accessToken")}`,
            },
          }
        );
        Alert.alert("Report Submitted", "Thank you for your feedback!");
      } catch (error) {
        console.error("Error reporting marker: ", error);
        Alert.alert("Error", "Could not submit the report.");
      }
    }
  };

  // Function to add a new marker
  const handleAddMarker = async () => {
    if (isAddPressed) return;
    else {
      setIsAddPressed(true);
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const temp_reg = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
        setRegion(temp_reg);

        console.log(temp_reg);
        axios.post(
          process.env.EXPO_PUBLIC_API + "api/v1/markers/create",
          {
            latitude: temp_reg.latitude,
            longitude: temp_reg.longitude,
          },
          {
            headers: {
              Authorization: `Bearer ${await getToken("accessToken")}`,
            },
          }
        );

        Alert.alert("Success", "New marker added!");
      } catch (error) {
        console.log("Duplicate marker!");
      } finally {
        setIsAddPressed(false);
      }
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
    let minDistance = 0.004;

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
      if (markers.length === 0) {
        Alert.alert("No markers available", "There are no markers to claim.");
        return;
      } else {
        if (selectedMarker) {
          axios.post(
            process.env.EXPO_PUBLIC_API + "api/v1/markers/claim",
            {
              latitude: (selectedMarker as MarkerType).latitude,
              longitude: (selectedMarker as MarkerType).longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${await getToken("accessToken")}`,
              },
            }
          );
          setIsDrawerOpen(false);

          Alert.alert(
            "Marker Claimed!",
            "The closest marker has been deleted."
          );
        }
      }
    } catch (error) {
      console.error("Error claiming marker: ", error);
      Alert.alert("Error", "Could not claim the marker.");
    }
  };

  interface MapProps {
    googleMapsApiKey: string;
    style: object;
    region?: Region;
    showsUserLocation?: boolean;
    userLocationUpdateInterval: number;
    customMapStyle: any;
    followsUserLocation: boolean;
    provider: any;
  }

  const mapProps: MapProps = {
    googleMapsApiKey: "",
    style: StyleSheet.absoluteFill,
    region: region,
    showsUserLocation: hasLocationPermission,
    userLocationUpdateInterval: 1000,
    customMapStyle: mapStyle,
    followsUserLocation: true,
    provider: PROVIDER_GOOGLE,
  };

  if (Platform.OS === "web") {
    mapProps.googleMapsApiKey = process.env
      .EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;
    mapProps.provider = "google";
  } else {
    mapProps.provider = PROVIDER_GOOGLE;
  }

  return (
    <ActionSheetProvider>
      <GestureHandlerRootView style={styles.container}>
        <View style={StyleSheet.absoluteFill}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <MapView {...mapProps}>
              {markers.map((marker) => (
                <Marker
                  key={`${marker.longitude}+${marker.latitude}`}
                  coordinate={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  }}
                  title={`Status: ${marker.status}`}
                  anchor={{ x: 0.5, y: 1 }} // Adjust the anchor to the bottom center of the image
                  calloutAnchor={{ x: 0.5, y: 0 }} // Adjust the callout anchor
                >
                  <View style={styles.markerContainer}>
                    <Image
                      source={
                        marker.status === "AVAILABLE"
                          ? require("../../assets/images/parking_available.png")
                          : marker.status === "MAYBE_UNAVAILABLE"
                          ? require("../../assets/images/parking_maybe_unavailable.png")
                          : require("../../assets/images/parking_maybe_not_valid.png")
                      }
                      style={{ width: 32, height: 32 }}
                    />
                  </View>
                </Marker>
              ))}
            </MapView>
          )}
          <CreatePointButton onPress={handleAddMarker} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});
