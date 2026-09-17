// mobile/src/utils/globalErrorHandler.ts
import { Alert } from "react-native";

// ErrorBoundary only catches errors inside React's render tree. A crash
// during module initialization (a bad native binding, a broken import)
// happens before React even mounts, so it slips past ErrorBoundary
// entirely — this is the more likely cause of an "opens then instantly
// closes" symptom. Installing this as the very first thing App.tsx does
// (before any other import runs) gives us a last-resort net: it shows a
// plain Alert with the message and stack instead of a silent close.
//
// Call setupGlobalErrorHandler() at the very top of App.tsx, before any
// other imports if possible.
export function setupGlobalErrorHandler(): void {
  const globalAny = globalThis as any;

  if (typeof globalAny.ErrorUtils !== "undefined") {
    const originalHandler = globalAny.ErrorUtils.getGlobalHandler();

    globalAny.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      Alert.alert(
        isFatal ? "Fatal error" : "Error",
        `${error.message}\n\n${error.stack || ""}`.slice(0, 2000),
        [{ text: "OK" }]
      );
      // Still call the original handler so React Native's own dev-mode
      // red screen (if applicable) and any crash reporting still runs.
      if (originalHandler) originalHandler(error, isFatal);
    });
  }
}
