import { setupGlobalErrorHandler } from "./src/utils/globalErrorHandler";
setupGlobalErrorHandler();

import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import ErrorBoundary from "./src/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
