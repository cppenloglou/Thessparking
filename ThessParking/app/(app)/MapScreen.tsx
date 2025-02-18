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
  import { CompatClient, Stomp } from "@stomp/stompjs";
  import SockJS from "sockjs-client";
  import { getToken } from "../tokenHandling";
  import axios from "axios";
  import { MarkerType, MapProps } from "./Model";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

  

  export default function MapScreen() {
    const { logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [markers, setMarkers] = useState<MarkerType[]>([]);
    const [region, setRegion] = useState<Region>({ // Thessaloniki coordinates
        latitude: 40.6401,
        longitude: 22.9444,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
    });
    const [isAddPressed, setIsAddPressed] = useState(true);

    let stompClient:any = null;

    let bearerToken: any;

    const connect = () => {
        stompClient = Stomp.over(new SockJS(`${process.env.EXPO_PUBLIC_API}ws`))
        console.log("Connecting to WebSocket...");
        const headers = { Authorization: `Bearer ${bearerToken}` };
        stompClient.connect(headers, onConnected, onError);
    };
    
    const onConnected = () => {
       console.log("Established WebSocket connection!");
        stompClient.subscribe("/topic/nearby-markers", onMarkersReceived);
        //stompClient.subscribe("/topic/markers", onMarkerUpdated);
        requestNearbyMarkers();
    }

    const requestNearbyMarkers =  () => {
        const locationRequest = {latitude: region.latitude, longitude: region.longitude};
        stompClient.send(
          "/app/markers",
          { Authorization: `Bearer ${bearerToken}` },
          JSON.stringify(locationRequest)
        );
    };

    const onMarkersReceived = (message: any): void => {
        try {
            let markerRes = JSON.parse(message.body);
            console.log("Markers received:", markerRes);
            setMarkers(markerRes);
        } catch (e) {
          console.error("Error parsing markers:", e);
        }
    }

    const onMarkerUpdated = (message: any): void => {
        try {
          const markerReceived = JSON.parse(message.body);
          // TODO check also the distance from the user (either way the distant markers will get removed because of the 
          // setInterval)
          if(markerReceived.action === "DELETE"){
            setMarkers(
                markers.filter((marker) =>
                    marker.longitude !== markerReceived.longitude ||
                    marker.latitude !== markerReceived.latitude
                )
            );
          } else if(markerReceived.action === "UPDATE"){
            setMarkers(
                markers.map((marker) =>
                    marker.longitude === markerReceived.longitude &&
                    marker.latitude === markerReceived.latitude
                    ? markerReceived
                    : marker
                )
            );
          } else if(markerReceived.action === "CREATE"){
            console.log(markers);
            setMarkers([...markers, markerReceived]);
            console.log(markers);
          }
        } catch (e) {
          console.error("Error parsing marker update:", e);
        }
    }
    
    const onError = (error: any): void => {
        console.error("WebSocket connection failed:", error);
    }

    const setUserLocation = async () => {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
        });
    }

    const handleAddMarker = async () => {
      if (isAddPressed) return;
      else {
        setIsAddPressed(true);
        try {
          setUserLocation();
  
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

          if(res.data){
            Alert.alert("Success", "New marker added!");
          }
        } catch (error) {
          console.log("Duplicate marker!");
        } finally {
          setIsAddPressed(false);
        }
      }
    };

    useEffect(() => {
        (async () => {
          try {
            let notAccepted = true;
            while(notAccepted){
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                    notAccepted = false;
                } else {
                    Alert.alert(
                        "Permission Denied",
                        "Please enable location permissions in settings."
                    );
                }
            }

            setUserLocation();
            bearerToken = await getToken("accessToken");
            try{
                connect();
                console.log("PEOS");
                setInterval(async() => {
                  setUserLocation();
                  requestNearbyMarkers();
              }, 30000);
            } catch (error) {
                return;
            }
            setIsAddPressed(false);
            setIsLoading(false);
          } catch (error) {
            console.error("Error getting location:", error);
          }
        })();
      }, []);
     
    
    const mapProps: MapProps = {
      googleMapsApiKey: "",
      style: StyleSheet.absoluteFill,
      region: region,
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
              {/* <BottomDrawer
                isVisible={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onClaim={handleClaimMarker}
                onReport={handleReport}
              /> */}
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