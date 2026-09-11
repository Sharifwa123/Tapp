// mobile/src/screens/SettingsScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { saveCredentials, getCredentials, clearCredentials } from "../services/credentialsService";
import type { ProviderName } from "../services/credentialsService";

const PROVIDERS: { value: ProviderName; label: string; note: string }[] = [
  { value: "openai", label: "OpenAI", note: "Used for transcription (Whisper)." },
  { value: "anthropic", label: "Anthropic", note: "Used for translation and summarization." },
];

export default function SettingsScreen() {
  const [provider, setProvider] = useState<ProviderName>("openai");
  const [apiKey, setApiKey] = useState("");
  const [savedProvider, setSavedProvider] = useState<ProviderName | null>(null);

  useEffect(() => {
    getCredentials().then((creds) => {
      if (creds) setSavedProvider(creds.provider);
    });
  }, []);

  async function handleSave() {
    if (!apiKey.trim()) {
      Alert.alert("Enter a key", "Paste your API key before saving.");
      return;
    }
    await saveCredentials(provider, apiKey.trim());
    setSavedProvider(provider);
    setApiKey("");
    Alert.alert("Saved", `${provider} key saved securely on this device.`);
  }

  async function handleClear() {
    await clearCredentials();
    setSavedProvider(null);
    Alert.alert("Cleared", "API key removed from this device.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>AI Provider</Text>
      <Text style={styles.hint}>
        The app calls your own backend, which uses this key to reach the AI provider. Your key is
        stored only on this device's secure keystore — never sent anywhere except your backend.
      </Text>

      <View style={styles.providerRow}>
        {PROVIDERS.map((p) => (
          <Pressable
            key={p.value}
            style={[styles.providerChip, provider === p.value && styles.providerChipActive]}
            onPress={() => setProvider(p.value)}
          >
            <Text style={[styles.providerChipText, provider === p.value && styles.providerChipTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.providerNote}>{PROVIDERS.find((p) => p.value === provider)?.note}</Text>

      <TextInput
        style={styles.input}
        placeholder="Paste API key"
        secureTextEntry
        value={apiKey}
        onChangeText={setApiKey}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save key</Text>
      </Pressable>

      {savedProvider && (
        <View style={styles.savedBanner}>
          <Text style={styles.savedBannerText}>A key is saved for: {savedProvider}</Text>
          <Pressable onPress={handleClear}>
            <Text style={styles.clearLink}>Clear</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0", padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1a1d1f", marginBottom: 8 },
  hint: { fontSize: 12.5, color: "#6b6862", lineHeight: 18, marginBottom: 20 },
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
  providerNote: { fontSize: 12, color: "#6b6862", marginBottom: 20 },
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
  savedBanner: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#e4ebe7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savedBannerText: { fontSize: 13, color: "#3d5a4c", fontWeight: "500" },
  clearLink: { fontSize: 13, color: "#a34d3f", fontWeight: "600" },
});
