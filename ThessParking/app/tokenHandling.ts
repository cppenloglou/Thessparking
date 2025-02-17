import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from 'react-native';

let inMemoryToken: string | null = null;

export const storeToken = async (storage_key: string, token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      inMemoryToken = token;
      console.log("Token securely stored in memory for web!");
    } else {
      await SecureStore.setItemAsync(storage_key, token);
      console.log("Token securely stored in SecureStore for mobile!");
    }
  } catch (error) {
    console.error("Error storing token:", error);
  }
};

export const getToken = async (storage_key: string): Promise<string | null | undefined> => {
  try {
    if (Platform.OS === 'web') {
      if(!inMemoryToken) {
        try {
          await refreshToken();
        } catch (finalError) {
          console.error("Error refreshing token:", finalError);
          return null;
        } 
      
        return inMemoryToken
      }
    } else {
      return await SecureStore.getItemAsync(storage_key);
    }
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;  
  }
};

export const removeToken = async (storage_key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      inMemoryToken = null;
      console.log("Token removed from memory for web!");
    } else {
      await SecureStore.deleteItemAsync(storage_key);
      console.log("Token removed from SecureStore for mobile!");
    }
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

export const storeRefreshToken = (refreshToken: string): void => {
  try {
    if (Platform.OS === 'web') {
      document.cookie = `refreshToken=${refreshToken}; path=/;`; 
      console.log("Refresh token stored in cookie!");
    } else {
      SecureStore.setItem("refreshToken", refreshToken);
      console.log("Refresh token stored in SecureStore for mobile!");
    }
  } catch (error) {
    console.error("Error storing refresh token in cookie:", error);
  }
  
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if(Platform.OS === 'web'){
      const cookies = document.cookie.split('; ');
      for (let cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'refreshToken') {
          return value;
        }
      }
      return null;
    } else {
      return await SecureStore.getItemAsync("refreshToken");
    }
  } catch (error) {
    console.error("Error retrieving refresh token from cookie:", error);
    return null;
  }
};

export const removeRefreshToken = async (): Promise<void> => {
  try {
    if(Platform.OS === 'web'){
    document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    console.log("Refresh token removed from cookie!");
  } else {
    await SecureStore.deleteItemAsync("refreshToken");
    console.log("Refresh token removed from SecureStore for mobile!");
  }
  } catch (error) {
    console.error("Error removing refresh token from cookie:", error);
  }
};

export const refreshToken = async (): Promise<void> => {
  try {
    const refreshedToken = await getRefreshToken();
    if (!refreshedToken) {
      console.error("No refresh token available");
      return;
    }
 
    const res = await axios.post(
      process.env.EXPO_PUBLIC_API + "api/v1/auth/refresh-token", 
      {},
      {
        headers: {
          'Authorization': `Bearer ${refreshedToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("EDO", res.data);
    storeToken("accessToken",res.data.access_token);
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
};
