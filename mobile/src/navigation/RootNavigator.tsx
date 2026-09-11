// mobile/src/navigation/RootNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import RecordScreen from "../screens/RecordScreen";
import ImportScreen from "../screens/ImportScreen";
import LibraryScreen from "../screens/LibraryScreen";
import ProjectDetailScreen from "../screens/ProjectDetailScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerStyle: { backgroundColor: "#f7f5f0" }, headerShadowVisible: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Record" component={RecordScreen} options={{ title: "Record" }} />
        <Stack.Screen name="Import" component={ImportScreen} options={{ title: "Import" }} />
        <Stack.Screen name="Library" component={LibraryScreen} options={{ title: "Library" }} />
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={{ title: "Project" }}
        />
        <Stack.Screen name="Analysis" options={{ title: "Analyze" }}>
          {() => <PlaceholderScreen title="Analysis (transcribe/translate/summarize)" />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
