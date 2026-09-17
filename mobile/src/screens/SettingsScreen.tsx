// mobile/src/screens/SettingsScreen.tsx
import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  SUPPORTED_PROVIDERS,
  listCredentials,
  addCredential,
  removeCredential,
  setActiveCredential,
  getActiveCredentialId,
} from "../services/credentialsService";
import type { ProviderName, SavedCredential } from "../services/credentialsService";

const PROVIDER_LABELS: Record<ProviderName, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const PROVIDER_NOTES: Record<ProviderName, string> = {
  openai: "Used for transcription (Whisper).",
  anthropic: "Used for translation and summarization.",
};

function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export default function SettingsScreen() {
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [activeIds, setActiveIds] = useState<Partial<Record<ProviderName, string>>>({});
  const [provider, setProvider] = useState<ProviderName>("openai");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const [creds, ...active] = await Promise.all([
      listCredentials(),
      ...SUPPORTED_PROVIDERS.map((p) => getActiveCredentialId(p)),
    ]);
    setCredentials(creds);
    const activeMap: Partial<Record<ProviderName, string>> = {};
    SUPPORTED_PROVIDERS.forEach((p, i) => {
      const id = active[i];
      if (id) activeMap[p] = id;
    });
    setActiveIds(activeMap);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleAdd() {
    if (!apiKey.trim()) {
      Alert.alert("Enter a key", "Paste your API key before saving.");
      return;
    }
    setSaving(true);
    try {
      await addCredential(provider, label, apiKey.trim());
      setLabel("");
      setApiKey("");
      await reload();
    } finally {
      setSaving(false);
    }
  }

  function handleSetActive(credential: SavedCredential) {
    setActiveCredential(credential.provider, credential.id).then(reload);
  }

  function handleDelete(credential: SavedCredential) {
    Alert.alert("Remove key", `Remove "${credential.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeCredential(credential.id).then(reload),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={credentials}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>AI Provider Keys</Text>
            <Text style={styles.hint}>
              The app calls your own backend, which uses these keys to reach each AI provider. Add
              as many as you like — keys are stored only on this device's secure keystore, never
              sent anywhere except your backend. The active key for a provider is used automatically
              wherever that provider is needed.
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No keys saved yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = activeIds[item.provider] === item.id;
          return (
            <View style={styles.credentialCard}>
              <View style={styles.credentialInfo}>
                <View style={styles.credentialTitleRow}>
                  <Text style={styles.providerBadge}>{PROVIDER_LABELS[item.provider]}</Text>
                  {isActive && <Text style={styles.activeBadge}>Active</Text>}
                </View>
                <Text style={styles.credentialLabel}>{item.label}</Text>
                <Text style={styles.credentialKey}>{maskKey(item.apiKey)}</Text>
              </View>
              <View style={styles.credentialActions}>
                {!isActive && (
                  <Pressable onPress={() => handleSetActive(item)}>
                    <Text style={styles.useLink}>Use</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => handleDelete(item)}>
                  <Text style={styles.removeLink}>Remove</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.addForm}>
            <Text style={styles.sectionTitle}>Add a key</Text>

            <View style={styles.providerRow}>
              {SUPPORTED_PROVIDERS.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.providerChip, provider === p && styles.providerChipActive]}
                  onPress={() => setProvider(p)}
                >
                  <Text style={[styles.providerChipText, provider === p && styles.providerChipTextActive]}>
                    {PROVIDER_LABELS[p]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.providerNote}>{PROVIDER_NOTES[provider]}</Text>

            <TextInput
              style={styles.input}
              placeholder="Label (e.g. Personal, Team)"
              value={label}
              onChangeText={setLabel}
            />
            <TextInput
              style={styles.input}
              placeholder="Paste API key"
              secureTextEntry
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save key"}</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },
  listContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1a1d1f", marginBottom: 8 },
  hint: { fontSize: 12.5, color: "#6b6862", lineHeight: 18, marginBottom: 20 },
  emptyState: {
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateText: { color: "#6b6862", fontSize: 13 },
  credentialCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  credentialInfo: { flex: 1, gap: 4 },
  credentialTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  providerBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3d5a4c",
    backgroundColor: "#e4ebe7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  activeBadge: { fontSize: 11, fontWeight: "600", color: "#1a1d1f" },
  credentialLabel: { fontSize: 14, fontWeight: "600", color: "#1a1d1f" },
  credentialKey: { fontSize: 12, color: "#6b6862", fontFamily: "monospace" },
  credentialActions: { flexDirection: "row", gap: 14, marginLeft: 12 },
  useLink: { fontSize: 13, color: "#3d5a4c", fontWeight: "600" },
  removeLink: { fontSize: 13, color: "#a34d3f", fontWeight: "600" },
  addForm: { marginTop: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#d8d3c8" },
  providerRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  providerChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d8d3c8",
    backgroundColor: "white",
  },
  providerChipActive: { backgroundColor: "#1a1d1f", borderColor: "#1a1d1f" },
  providerChipText: { fontSize: 13, fontWeight: "500", color: "#1a1d1f" },
  providerChipTextActive: { color: "white" },
  providerNote: { fontSize: 12, color: "#6b6862", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: "white",
    marginBottom: 12,
  },
  saveBtn: { backgroundColor: "#1a1d1f", borderRadius: 8, padding: 14, alignItems: "center" },
  saveBtnText: { color: "white", fontWeight: "600", fontSize: 15 },
});
