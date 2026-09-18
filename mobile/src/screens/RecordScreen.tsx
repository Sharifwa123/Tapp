// mobile/src/screens/RecordScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, TextInput } from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from "expo-audio";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { importMediaAsNewProject } from "../services/mediaService";

type Props = NativeStackScreenProps<RootStackParamList, "Record">;

type RecordState = "idle" | "recording" | "paused" | "stopped";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function RecordScreen({ navigation }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [state, setState] = useState<RecordState>("idle");
  const [finalDurationMs, setFinalDurationMs] = useState(0);
  const [recordingName, setRecordingName] = useState("");
  const [saving, setSaving] = useState(false);

  const displayMs = state === "stopped" ? finalDurationMs : recorderState.durationMillis;

  useEffect(() => {
    return () => {
      // If the screen unmounts mid-recording, stop rather than leaving a
      // dangling native recording session.
      if (recorder.isRecording) recorder.stop().catch(() => {});
    };
  }, [recorder]);

  async function handleStart() {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone permission needed", "Enable microphone access to record.");
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState("recording");
    } catch (err: any) {
      Alert.alert("Could not start recording", String(err.message || err));
    }
  }

  function handlePause() {
    recorder.pause();
    setState("paused");
  }

  function handleResume() {
    recorder.record();
    setState("recording");
  }

  async function handleStop() {
    setFinalDurationMs(recorderState.durationMillis);
    await recorder.stop();
    setState("stopped");
  }

  function handleCancel() {
    recorder.stop().catch(() => {});
    setFinalDurationMs(0);
    setState("idle");
  }

  async function handleSave() {
    const uri = recorder.uri;
    if (!uri) {
      Alert.alert("Nothing to save", "The recording has no audio file.");
      return;
    }

    setSaving(true);
    try {
      const name = recordingName.trim() || `Recording ${new Date().toLocaleString()}`;
      const { project } = await importMediaAsNewProject({
        sourceUri: uri,
        fileName: `${name}.m4a`,
        mimeType: "audio/m4a",
        projectName: name,
        durationMs: finalDurationMs,
      });
      navigation.replace("ProjectDetail", { projectId: project.id });
    } catch (err: any) {
      Alert.alert("Save failed", String(err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatDuration(displayMs)}</Text>

      {state === "stopped" ? (
        <View style={styles.savePanel}>
          <TextInput
            style={styles.nameInput}
            placeholder="Name this recording"
            value={recordingName}
            onChangeText={setRecordingName}
          />
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={handleCancel} disabled={saving}>
              <Text style={styles.btnGhostText}>Discard</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={handleSave} disabled={saving}>
              <Text style={styles.btnText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.controls}>
          {state === "idle" && (
            <Pressable style={styles.recordBtn} onPress={handleStart}>
              <Text style={styles.recordBtnText}>●</Text>
            </Pressable>
          )}
          {state === "recording" && (
            <View style={styles.row}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={handlePause}>
                <Text style={styles.btnGhostText}>Pause</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnStop]} onPress={handleStop}>
                <Text style={styles.btnText}>Stop</Text>
              </Pressable>
            </View>
          )}
          {state === "paused" && (
            <View style={styles.row}>
              <Pressable style={styles.btn} onPress={handleResume}>
                <Text style={styles.btnText}>Resume</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnStop]} onPress={handleStop}>
                <Text style={styles.btnText}>Stop</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0", alignItems: "center", justifyContent: "center", padding: 24 },
  timer: { fontSize: 48, fontWeight: "600", color: "#1a1d1f", marginBottom: 40, fontVariant: ["tabular-nums"] },
  controls: { alignItems: "center" },
  recordBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#a34d3f",
    alignItems: "center",
    justifyContent: "center",
  },
  recordBtnText: { color: "white", fontSize: 32 },
  row: { flexDirection: "row", gap: 12 },
  btn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, backgroundColor: "#1a1d1f" },
  btnStop: { backgroundColor: "#a34d3f" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#d8d3c8" },
  btnText: { color: "white", fontWeight: "600", fontSize: 15 },
  btnGhostText: { color: "#1a1d1f", fontWeight: "600", fontSize: 15 },
  savePanel: { width: "100%", gap: 16 },
  nameInput: {
    borderWidth: 1,
    borderColor: "#d8d3c8",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: "white",
  },
});
