// mobile/src/screens/ProjectDetailScreen.tsx
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getProject } from "../storage/projectRepository";
import { getMediaItemsForProject } from "../storage/mediaRepository";
import type { Project, MediaItem } from "../storage/types";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectDetail">;

const KIND_ICON: Record<string, string> = {
  audio: "🎵",
  video: "🎥",
  document: "📄",
  recording: "🎙",
};

export default function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([getProject(projectId), getMediaItemsForProject(projectId)]).then(
        ([proj, mediaItems]) => {
          if (cancelled) return;
          setProject(proj);
          setItems(mediaItems);
          setLoading(false);
        }
      );
      return () => {
        cancelled = true;
      };
    }, [projectId])
  );

  React.useLayoutEffect(() => {
    if (project) navigation.setOptions({ title: project.name });
  }, [project, navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Project not found.</Text>
      </View>
    );
  }

  const original = items.find((i) => i.isOriginal);
  const derived = items.filter((i) => !i.isOriginal);

  return (
    <View style={styles.container}>
      {original && (
        <Pressable
          style={styles.originalCard}
          onPress={() => navigation.navigate("Analysis", { mediaItemId: original.id })}
        >
          <Text style={styles.kindIcon}>{KIND_ICON[original.kind] || "📄"}</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{original.fileName}</Text>
            <Text style={styles.cardSubtitle}>Original · {original.kind}</Text>
          </View>
          <View style={styles.openBtn}>
            <Text style={styles.openBtnText}>Open</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Generated</Text>
      {derived.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Nothing generated yet. Open the original above to transcribe, translate, or summarize it.
          </Text>
        </View>
      ) : (
        <FlatList
          data={derived}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.derivedCard}>
              <Text style={styles.kindIcon}>{KIND_ICON[item.kind] || "📄"}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.fileName}</Text>
                <Text style={styles.cardSubtitle}>
                  {item.languageCode ? `${item.kind} · ${item.languageCode}` : item.kind}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f7f5f0" },
  loadingText: { color: "#6b6862" },
  originalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  derivedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  kindIcon: { fontSize: 24 },
  cardText: { flex: 1 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#1a1d1f",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  openBtnText: { color: "white", fontSize: 13, fontWeight: "600" },
  chevron: { color: "white", fontSize: 15, fontWeight: "700", marginLeft: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1a1d1f" },
  cardSubtitle: { fontSize: 12, color: "#6b6862", marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#1a1d1f", marginBottom: 10 },
  emptyState: {
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 20,
  },
  emptyStateText: { color: "#6b6862", fontSize: 13, textAlign: "center" },
});
