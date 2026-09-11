// mobile/src/screens/LibraryScreen.tsx
import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getAllProjects, searchProjects } from "../storage/projectRepository";
import type { Project } from "../storage/types";

type Props = NativeStackScreenProps<RootStackParamList, "Library">;

export default function LibraryScreen({ navigation }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");

  const reload = useCallback(async (q: string) => {
    const results = q.trim() ? await searchProjects(q.trim()) : await getAllProjects();
    setProjects(results);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload(query);
    }, [reload, query])
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search projects…"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          reload(text);
        }}
      />

      {projects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {query ? "No projects match your search." : "No projects yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("ProjectDetail", { projectId: item.id })}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0", padding: 16 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: "white",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1a1d1f" },
  cardSubtitle: { fontSize: 12, color: "#6b6862", marginTop: 4 },
  emptyState: { padding: 24, alignItems: "center" },
  emptyStateText: { color: "#6b6862", fontSize: 13 },
});
