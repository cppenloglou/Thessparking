import { View, Text, StyleSheet, Button } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome!</Text>
      <View style={styles.signOutContainer}>
        <Button title="Sign Out" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  signOutContainer: {
    width: "100%",
    paddingHorizontal: 50,
  },
});
