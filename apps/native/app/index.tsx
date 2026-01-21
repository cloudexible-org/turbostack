import { Stack } from "expo-router";
import { View } from "react-native";
import { WebView } from "react-native-webview";

export default function HomeScreen() {
  const url =
    process.env.EXPO_PUBLIC_WEB_URL || "https://starter.cloudexible.com";

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </View>
  );
}
