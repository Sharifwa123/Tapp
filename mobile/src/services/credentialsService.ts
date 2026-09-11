// mobile/src/services/credentialsService.ts
import * as SecureStore from "expo-secure-store";

export type ProviderName = "openai" | "anthropic";

const PROVIDER_KEY = "tapp_ai_provider";
const API_KEY_KEY = "tapp_ai_api_key";

// API keys are sensitive — SecureStore uses the OS keystore (Android
// Keystore / iOS Keychain), not plain storage, so the key never sits in
// a readable file the way it would with AsyncStorage.
export async function saveCredentials(provider: ProviderName, apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(PROVIDER_KEY, provider);
  await SecureStore.setItemAsync(API_KEY_KEY, apiKey);
}

export async function getCredentials(): Promise<{ provider: ProviderName; apiKey: string } | null> {
  const provider = await SecureStore.getItemAsync(PROVIDER_KEY);
  const apiKey = await SecureStore.getItemAsync(API_KEY_KEY);
  if (!provider || !apiKey) return null;
  return { provider: provider as ProviderName, apiKey };
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(PROVIDER_KEY);
  await SecureStore.deleteItemAsync(API_KEY_KEY);
}
