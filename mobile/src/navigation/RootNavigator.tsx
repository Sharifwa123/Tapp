// mobile/src/navigation/RootNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import RecordScreen from "../screens/RecordScreen";
import ImportScreen from "../screens/ImportScreen";
import LibraryScreen from "../screens/LibraryScreen";
import ProjectDetailScreen from "../screens/ProjectDetailScreen";
import AnalysisScreen from "../screens/AnalysisScreen";
import SettingsScreen from "../screens/SettingsScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerStyle: { backgroundColor: "#f7f5f0" }, headerShadowVisible: false }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerRight: () => (
              <Pressable onPress={() => navigation.navigate("Settings")}>
                <Text style={{ fontSize: 20 }}>⚙️</Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen name="Record" component={RecordScreen} options={{ title: "Record" }} />
        <Stack.Screen name="Import" component={ImportScreen} options={{ title: "Import" }} />
        <Stack.Screen name="Library" component={LibraryScreen} options={{ title: "Library" }} />
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={{ title: "Project" }}
        />
        <Stack.Screen name="Analysis" component={AnalysisScreen} options={{ title: "Analyze" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
