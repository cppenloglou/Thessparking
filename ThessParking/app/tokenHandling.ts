import * as SecureStore from "expo-secure-store";
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = String(process.env.EXPO_PUBLIC_ENCRYPTION_KEY);

const encryptToken = (token: string): string => {
  const encrypted = CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
  return encrypted;
};

const decryptToken = (encryptedToken: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8); 
  return decrypted;
};

export const storeToken = async (storage_key: string, token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      const encryptedToken = encryptToken(token);
      await AsyncStorage.setItem(storage_key, encryptedToken);
      console.log("Token securely stored in AsyncStorage for web!");
    } else {
      const encryptedToken = encryptToken(token);
      await SecureStore.setItemAsync(storage_key, encryptedToken);
      console.log("Token securely stored in SecureStore for mobile!");
    }
  } catch (error) {
    console.error("Error storing token:", error);
  }
};

export const getToken = async (storage_key: string): Promise<string | null> => {
  try {
    let encryptedToken: string | null = null;

    if (Platform.OS === 'web') {
      encryptedToken = await AsyncStorage.getItem(storage_key);
    } else {
      encryptedToken = await SecureStore.getItemAsync(storage_key);
    }

    if (encryptedToken !== null) {
      return decryptToken(encryptedToken);
    }

    return null;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

export const removeToken = async (storage_key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(storage_key);
      console.log("Token removed from AsyncStorage for web!");
    } else {
      await SecureStore.deleteItemAsync(storage_key);
      console.log("Token removed from SecureStore for mobile!");
    }
  } catch (error) {
    console.error("Error removing token:", error);
  }
};
