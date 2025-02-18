import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate a delay to ensure the navigation system is ready
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 100); // Adjust the delay as needed

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isReady) return; // Wait until the navigation system is ready

    if (!isAuthenticated) {
      router.replace("/(auth)/loginScreen");
    }
  }, [isAuthenticated, isReady]);

  return (
    <Stack>
      <Stack.Screen
        name="MapScreen"
        options={{
          title: "MapScreen",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
