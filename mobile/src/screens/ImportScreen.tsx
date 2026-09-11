// mobile/src/screens/ImportScreen.tsx
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { importMediaAsNewProject } from "../services/mediaService";

type Props = NativeStackScreenProps<RootStackParamList, "Import">;

export default function ImportScreen({ navigation }: Props) {
  const [importing, setImporting] = useState(false);

  async function handlePick() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "audio/*",
          "video/*",
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setImporting(true);

      const { project } = await importMediaAsNewProject({
        sourceUri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType,
      });

      navigation.replace("ProjectDetail", { projectId: project.id });
    } catch (err: any) {
      Alert.alert("Import failed", String(err.message || err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <View style={styles.container}>
      {importing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3d5a4c" />
          <Text style={styles.statusText}>Importing…</Text>
        </View>
      ) : (
        <Pressable style={styles.pickBtn} onPress={handlePick}>
          <Text style={styles.pickIcon}>📁</Text>
          <Text style={styles.pickText}>Choose a file</Text>
          <Text style={styles.pickSubtext}>Audio, video, PDF, DOCX, or TXT</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0", alignItems: "center", justifyContent: "center", padding: 24 },
  center: { alignItems: "center", gap: 12 },
  statusText: { color: "#6b6862", fontSize: 14 },
  pickBtn: {
    borderWidth: 1.5,
    borderColor: "#d8d3c8",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  pickIcon: { fontSize: 36 },
  pickText: { fontSize: 16, fontWeight: "600", color: "#1a1d1f" },
  pickSubtext: { fontSize: 13, color: "#6b6862" },
});
