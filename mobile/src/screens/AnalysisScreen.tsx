// mobile/src/screens/AnalysisScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getMediaItem } from "../storage/mediaRepository";
import { getTranscriptForMediaItem, createTranscript, createTranslation, createSummary, getTranslationsForTranscript, getSummariesForTranscript } from "../storage/contentRepository";
import { transcribeAudio, translateText, summarizeText, MissingCredentialsError } from "../services/apiClient";
import type { MediaItem, Transcript, Translation, Summary, SummaryStyle } from "../storage/types";

type Props = NativeStackScreenProps<RootStackParamList, "Analysis">;

type Stage = "idle" | "transcribing" | "translating" | "summarizing";

const SUMMARY_STYLES: { value: SummaryStyle; label: string }[] = [
  { value: "quick", label: "Quick" },
  { value: "detailed", label: "Detailed" },
  { value: "key_points", label: "Key Points" },
  { value: "action_items", label: "Action Items" },
  { value: "meeting_notes", label: "Meeting Notes" },
];

const TARGET_LANGUAGES = ["French", "Spanish", "Arabic", "Twi", "Hausa", "Portuguese", "German"];

export default function AnalysisScreen({ route }: Props) {
  const { mediaItemId } = route.params;

  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState(TARGET_LANGUAGES[0]);
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>("quick");

  const loadAll = useCallback(async () => {
    const item = await getMediaItem(mediaItemId);
    setMediaItem(item);
    if (!item) return;

    const existingTranscript = await getTranscriptForMediaItem(item.id);
    setTranscript(existingTranscript);

    if (existingTranscript) {
      const [t, s] = await Promise.all([
        getTranslationsForTranscript(existingTranscript.id),
        getSummariesForTranscript(existingTranscript.id),
      ]);
      setTranslations(t);
      setSummaries(s);
    }
  }, [mediaItemId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleTranscribe() {
    if (!mediaItem) return;
    setError(null);
    setStage("transcribing");
    try {
      const result = await transcribeAudio(mediaItem.fileUri, mediaItem.fileName);
      const saved = await createTranscript({
        mediaItemId: mediaItem.id,
        fullText: result.fullText,
        segments: result.segments,
        languageCode: result.detectedLanguage.languageCode,
        status: "done",
      });
      setTranscript(saved);
    } catch (err: any) {
      const message = err instanceof MissingCredentialsError ? err.message : String(err.message || err);
      setError(message);
      if (err instanceof MissingCredentialsError) {
        Alert.alert("API key needed", message);
      }
    } finally {
      setStage("idle");
    }
  }

  async function handleTranslate() {
    if (!transcript) return;
    setError(null);
    setStage("translating");
    try {
      const result = await translateText(transcript.fullText, targetLanguage, transcript.languageCode);
      const saved = await createTranslation({
        transcriptId: transcript.id,
        targetLanguage: result.targetLanguage,
        translatedText: result.translatedText,
        status: "done",
      });
      setTranslations((prev) => [saved, ...prev]);
    } catch (err: any) {
      const message = err instanceof MissingCredentialsError ? err.message : String(err.message || err);
      setError(message);
      if (err instanceof MissingCredentialsError) Alert.alert("API key needed", message);
    } finally {
      setStage("idle");
    }
  }

  async function handleSummarize() {
    if (!transcript) return;
    setError(null);
    setStage("summarizing");
    try {
      const result = await summarizeText(transcript.fullText, summaryStyle);
      const saved = await createSummary({
        transcriptId: transcript.id,
        style: result.style,
        content: result.content,
        status: "done",
      });
      setSummaries((prev) => [saved, ...prev]);
    } catch (err: any) {
      const message = err instanceof MissingCredentialsError ? err.message : String(err.message || err);
      setError(message);
      if (err instanceof MissingCredentialsError) Alert.alert("API key needed", message);
    } finally {
      setStage("idle");
    }
  }

  if (!mediaItem) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const isDocument = mediaItem.kind === "document";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.fileName}>{mediaItem.fileName}</Text>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!transcript && !isDocument && (
        <Pressable style={styles.primaryBtn} onPress={handleTranscribe} disabled={stage !== "idle"}>
          {stage === "transcribing" ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryBtnText}>Transcribe</Text>
          )}
        </Pressable>
      )}

      {transcript && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcript ({transcript.languageCode})</Text>
          <View style={styles.textBox}>
            <Text style={styles.textBoxContent}>{transcript.fullText}</Text>
          </View>

          <Text style={styles.sectionTitle}>Translate</Text>
          <View style={styles.chipRow}>
            {TARGET_LANGUAGES.map((lang) => (
              <Pressable
                key={lang}
                style={[styles.chip, targetLanguage === lang && styles.chipActive]}
                onPress={() => setTargetLanguage(lang)}
              >
                <Text style={[styles.chipText, targetLanguage === lang && styles.chipTextActive]}>
                  {lang}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.secondaryBtn} onPress={handleTranslate} disabled={stage !== "idle"}>
            {stage === "translating" ? (
              <ActivityIndicator color="#1a1d1f" />
            ) : (
              <Text style={styles.secondaryBtnText}>Translate to {targetLanguage}</Text>
            )}
          </Pressable>

          {translations.map((t) => (
            <View key={t.id} style={styles.textBox}>
              <Text style={styles.textBoxLabel}>{t.targetLanguage}</Text>
              <Text style={styles.textBoxContent}>{t.translatedText}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Summarize</Text>
          <View style={styles.chipRow}>
            {SUMMARY_STYLES.map((s) => (
              <Pressable
                key={s.value}
                style={[styles.chip, summaryStyle === s.value && styles.chipActive]}
                onPress={() => setSummaryStyle(s.value)}
              >
                <Text style={[styles.chipText, summaryStyle === s.value && styles.chipTextActive]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.secondaryBtn} onPress={handleSummarize} disabled={stage !== "idle"}>
            {stage === "summarizing" ? (
              <ActivityIndicator color="#1a1d1f" />
            ) : (
              <Text style={styles.secondaryBtnText}>Generate summary</Text>
            )}
          </Pressable>

          {summaries.map((s) => (
            <View key={s.id} style={styles.textBox}>
              <Text style={styles.textBoxLabel}>{SUMMARY_STYLES.find((x) => x.value === s.style)?.label}</Text>
              <Text style={styles.textBoxContent}>{s.content}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f7f5f0" },
  loadingText: { color: "#6b6862" },
  fileName: { fontSize: 18, fontWeight: "600", color: "#1a1d1f", marginBottom: 16 },
  errorBanner: { backgroundColor: "#a34d3f", borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: "white", fontSize: 13 },
  primaryBtn: { backgroundColor: "#1a1d1f", borderRadius: 8, padding: 14, alignItems: "center" },
  primaryBtnText: { color: "white", fontWeight: "600", fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    backgroundColor: "white",
    marginBottom: 16,
  },
  secondaryBtnText: { color: "#1a1d1f", fontWeight: "600", fontSize: 14 },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#1a1d1f", marginTop: 20, marginBottom: 10 },
  textBox: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  textBoxLabel: { fontSize: 11, fontWeight: "600", color: "#6b6862", marginBottom: 6, textTransform: "uppercase" },
  textBoxContent: { fontSize: 14, color: "#1a1d1f", lineHeight: 21 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d8d3c8",
    backgroundColor: "white",
  },
  chipActive: { backgroundColor: "#1a1d1f", borderColor: "#1a1d1f" },
  chipText: { fontSize: 12.5, color: "#1a1d1f", fontWeight: "500" },
  chipTextActive: { color: "white" },
});
