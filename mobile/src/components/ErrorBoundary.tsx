// mobile/src/components/ErrorBoundary.tsx
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: string | null;
}

// Wraps the whole app. Without this, an uncaught error during render
// (a bad import, a null access, a missing native module) just crashes
// the process with no on-screen indication of why — exactly the
// "closes immediately, only shows the icon" symptom. This catches that
// and renders the actual message + stack instead, so the failure is
// visible without needing adb/logcat.
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo: errorInfo.componentStack || null });
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Something crashed</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          {this.state.error.stack && (
            <>
              <Text style={styles.sectionLabel}>Stack</Text>
              <Text style={styles.stack}>{this.state.error.stack}</Text>
            </>
          )}
          {this.state.errorInfo && (
            <>
              <Text style={styles.sectionLabel}>Component stack</Text>
              <Text style={styles.stack}>{this.state.errorInfo}</Text>
            </>
          )}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1d1f" },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: "700", color: "#ff6b6b", marginBottom: 12 },
  message: { fontSize: 15, color: "white", marginBottom: 20, lineHeight: 22 },
  sectionLabel: { fontSize: 12, color: "#a34d3f", fontWeight: "600", marginBottom: 6, marginTop: 12 },
  stack: { fontSize: 11, color: "#ccc", fontFamily: "monospace" },
});
