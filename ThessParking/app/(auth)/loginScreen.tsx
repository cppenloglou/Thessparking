import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import Checkbox from "expo-checkbox";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import Alert from "../Alert";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isChecked, setChecked] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const getEmailFromStore = async () => {
      try {
        let storedEmail;
        if (Platform.OS === "web") {
          storedEmail = await AsyncStorage.getItem("userEmail");
        } else {
          storedEmail = await SecureStore.getItemAsync("userEmail");
        }

        if (storedEmail) {
          setEmail(storedEmail);
          setChecked(true);
        }
      } catch (error) {
        console.log("Error fetching email from storage:", error);
      }
    };

    getEmailFromStore();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);

      if (isChecked) {
        try {
          if (Platform.OS === "web") {
            await AsyncStorage.setItem("userEmail", email);
          } else {
            await SecureStore.setItemAsync("userEmail", email);
          }
        } catch (error) {
          console.log("Error saving email to storage:", error);
        }
      } else {
        try {
          if (Platform.OS === "web") {
            await AsyncStorage.removeItem("userEmail");
          } else {
            await SecureStore.deleteItemAsync("userEmail");
          }
        } catch (error) {
          console.log("Error removing email from storage:", error);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.label}>Email address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />
      <View style={styles.rememberMeContainer}>
        <Checkbox
          style={styles.checkBox}
          value={isChecked}
          onValueChange={setChecked}
        />
        <Text style={styles.rememberMeText}>Remember me</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
      <TouchableOpacity
        onPress={() => router.push("/signUpScreen")}
        style={styles.signupLink}
        disabled={loading}
      >
        <Text>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "gray",
    marginBottom: 2,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkBox: {
    marginRight: 8,
    borderRadius: 4,
  },
  rememberMeText: {
    color: "gray",
  },
  signupLink: {
    marginTop: 20,
    alignItems: "center",
  },
});
