import { Region } from 'react-native-maps';

export type MarkerType = {
    latitude: number;
    longitude: number;
    status: string;
    action: string;
  };

export interface MapProps {
    googleMapsApiKey: string;
    style: object;
    region?: Region;
    showsUserLocation?: boolean;
    userLocationUpdateInterval: number;
    customMapStyle: any;
    provider: any;
  }