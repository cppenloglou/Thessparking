import {
  View,
  StyleSheet,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
  Text,
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
import { getToken } from "../tokenHandling";
import axios from "axios";
import { MarkerType, MapProps } from "./Model";

export default function MapScreen() {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [region, setRegion] = useState<Region>({
    // Thessaloniki coordinates
    latitude: 40.6401,
    longitude: 22.9444,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });
  const [isAddPressed, setIsAddPressed] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType>();

  const setUserLocation = async () => {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    setRegion(() => {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  const handleAddMarker = async () => {
    if (isAddPressed) return;
    else {
      setIsAddPressed(true);
      try {
        //Can't get user location in docker container using mock
        // const response = await setUserLocation();

        console.log("TEST");
        const res = await axios.post(
          process.env.EXPO_PUBLIC_API + "api/v1/markers/create",
          {
            latitude: region.latitude,
            longitude: region.longitude,
          },
          {
            headers: {
              Authorization: `Bearer ${await getToken("accessToken")}`,
            },
          }
        );

        console.log("RES: ", res);

        if (res.data) {
          Alert.alert("Success", "New marker added!");
        }
      } catch (error) {
        console.log("Duplicate marker!");
      } finally {
        setIsAddPressed(false);
      }
    }
  };

  // Function to claim (delete) the nearest marker
  const handleClaimMarker = async () => {
    if (isAddPressed) return;
    else {
      setIsAddPressed(true);
      try {
        if (markers.length === 0) {
          Alert.alert("No markers available", "There are no markers to claim.");
          return;
        } else {
          if (!selectedMarker) {
            // Check if selectedMarker is undefined
            Alert.alert("No marker selected", "Please select a marker first.");
            return;
          }
          const res = await axios.post(
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
          if (res.data) {
            setSelectedMarker(undefined);
            Alert.alert(
              "Marker Claimed!",
              "The closest marker has been deleted."
            );
          }
        }
      } catch (error) {
        console.error("Error claiming marker: ", error);
        Alert.alert("Error", "Could not claim the marker.");
      } finally {
        setIsAddPressed(false);
      }
    }
  };

  // Function to report marker as not valid
  const handleReport = async (reportType: string) => {
    if (isAddPressed) return;
    else {
      setIsAddPressed(true);
      try {
        if (markers.length === 0) {
          Alert.alert("No markers available", "There are no markers to claim.");
          return;
        } else {
          if (!selectedMarker) {
            // Check if selectedMarker is undefined
            Alert.alert("No marker selected", "Please select a marker first.");
            return;
          }
          const res = await axios.post(
            process.env.EXPO_PUBLIC_API + "api/v1/markers/report",
            {
              latitude: (selectedMarker as MarkerType).latitude,
              longitude: (selectedMarker as MarkerType).longitude,
              reportType: reportType,
            },
            {
              headers: {
                Authorization: `Bearer ${await getToken("accessToken")}`,
              },
            }
          );
          if (res.data) {
            setSelectedMarker(undefined);
            Alert.alert("Marker Reported!");
          }
        }
      } catch (error) {
        console.error("Error reporting marker: ", error);
        Alert.alert("Error", "Could not report the marker.");
      } finally {
        setIsAddPressed(false);
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // Mock permission because docker cannot access gps data from host device
        const mockPermission = { status: "granted" };
        if (mockPermission.status === "granted") {
          // Mock user location (e.g., Thessaloniki coordinates)
          setRegion({
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          });

          // Simulate fetching markers
          const markersRes = await axios.post(
            process.env.EXPO_PUBLIC_API + "api/v1/markers/getMarkers",
            {
              latitude: 40.6401,
              longitude: 22.9444,
            },
            {
              headers: {
                Authorization: `Bearer ${await getToken("accessToken")}`,
              },
            }
          );

          setMarkers(markersRes.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    })();
  }, []);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       let notAccepted = true;
  //       while (notAccepted) {
  //         console.log("WAITING FOR LOCATION");
  //         const { status } = await Location.requestForegroundPermissionsAsync();
  //         if (status === "granted") {
  //           notAccepted = false;
  //         } else {
  //           Alert.alert(
  //             "Permission Denied",
  //             "Please enable location permissions in settings."
  //           );
  //         }
  //       }

  //       await setUserLocation();
  //       try {
  //         // connect();
  //         setInterval(async () => {
  //           const response = await setUserLocation();
  //           // requestNearbyMarkers();
  //           const markersRes = await axios.post(
  //             process.env.EXPO_PUBLIC_API + "api/v1/markers/getMarkers",
  //             {
  //               latitude: response.latitude,
  //               longitude: response.longitude,
  //             },
  //             {
  //               headers: {
  //                 Authorization: `Bearer ${await getToken("accessToken")}`,
  //               },
  //             }
  //           );

  //           let markers = markersRes.data;
  //           setMarkers(markers);
  //         }, 10000);
  //       } catch (error) {
  //         return;
  //       }
  //       setIsAddPressed(false);
  //       setIsLoading(false);
  //     } catch (error) {
  //       console.error("Error getting location:", error);
  //     }
  //   })();
  // }, []);

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

  const handleMarkerPress = (marker: MarkerType) => {
    if (
      getDistance(
        region.latitude,
        region.longitude,
        marker.latitude,
        marker.longitude
      ) <= 0.004
    ) {
      setSelectedMarker(marker);
    }
  };

  const mapProps: MapProps = {
    googleMapsApiKey: "",
    style: StyleSheet.absoluteFill,
    showsUserLocation: !isLoading,
    userLocationUpdateInterval: 1000,
    customMapStyle: mapStyle,
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
                  onPress={() => {
                    handleMarkerPress(marker);
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
                          : marker.status === "MAYBE_NOT_VALID"
                          ? require("../../assets/images/parking_maybe_not_valid.png")
                          : require("../../assets/images/parking_maybe_unavailable.png")
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
          {selectedMarker && (
            <View style={styles.buttonContainer}>
              <IconButton icon="check" size={60} onPress={handleClaimMarker} />
              <IconButton
                icon="alert-outline"
                size={60}
                onPress={() => handleReport("NOT_AVAILABLE")}
              />
              <IconButton
                icon="alert-remove-outline"
                size={60}
                onPress={() => handleReport("NOT_VALID")}
              />
            </View>
          )}
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
    top: "6%",
    left: "1%",
    elevation: 3,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 50,
  },
  buttonContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.70)",
    borderRadius: 50,
    flex: 1,
    flexDirection: "row",
    position: "absolute",
    top: "1%",
    left: "18%",
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});
