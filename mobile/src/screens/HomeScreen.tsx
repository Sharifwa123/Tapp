// mobile/src/screens/HomeScreen.tsx
import React, { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getAllProjects } from "../storage/projectRepository";
import type { Project } from "../storage/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const ACTIONS: { label: string; icon: string; route: keyof RootStackParamList }[] = [
  { label: "Record", icon: "🎙", route: "Record" },
  { label: "Import", icon: "📁", route: "Import" },
  { label: "Library", icon: "🗂", route: "Library" },
];

export default function HomeScreen({ navigation }: Props) {
  const [recent, setRecent] = useState<Project[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllProjects().then((all) => setRecent(all.slice(0, 5)));
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What do you want to process?</Text>

      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            style={styles.actionCard}
            onPress={() => navigation.navigate(action.route as any)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Projects</Text>
      {recent.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No projects yet. Record or import something to get started.
          </Text>
        </View>
      ) : (
        recent.map((project) => (
          <Pressable
            key={project.id}
            style={styles.projectCard}
            onPress={() => navigation.navigate("ProjectDetail", { projectId: project.id })}
          >
            <Text style={styles.projectTitle}>{project.name}</Text>
            <Text style={styles.projectSubtitle}>
              {new Date(project.updatedAt).toLocaleDateString()}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "600", color: "#1a1d1f", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 },
  actionCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8d3c8",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontWeight: "500", color: "#1a1d1f", textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1a1d1f", marginBottom: 12 },
  emptyState: {
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: { color: "#6b6862", fontSize: 13, textAlign: "center" },
  projectCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  projectTitle: { fontSize: 15, fontWeight: "600", color: "#1a1d1f" },
  projectSubtitle: { fontSize: 12, color: "#6b6862", marginTop: 4 },
});
