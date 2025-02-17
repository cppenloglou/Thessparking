import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/loginScreen");
    }
  }, [isAuthenticated]);

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
