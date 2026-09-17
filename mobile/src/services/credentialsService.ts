// mobile/src/services/credentialsService.ts
import * as SecureStore from "expo-secure-store";

// The set of providers the backend actually knows how to call
// (backend/src/providers/registry.ts). Adding a new vendor there means
// adding it here too — everything else (storage, the Settings UI,
// per-endpoint lookup) already works for any provider in this list.
export const SUPPORTED_PROVIDERS = ["openai", "anthropic"] as const;
export type ProviderName = (typeof SUPPORTED_PROVIDERS)[number];

export interface SavedCredential {
  id: string;
  provider: ProviderName;
  label: string;
  apiKey: string;
  createdAt: number;
}

const INDEX_KEY = "tapp_ai_cred_index";
const ACTIVE_KEY = "tapp_ai_cred_active";
const ENTRY_KEY_PREFIX = "tapp_ai_cred_";

function entryKey(id: string): string {
  return `${ENTRY_KEY_PREFIX}${id}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readIndex(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeIndex(ids: string[]): Promise<void> {
  await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(ids));
}

async function readActiveMap(): Promise<Partial<Record<ProviderName, string>>> {
  const raw = await SecureStore.getItemAsync(ACTIVE_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function writeActiveMap(map: Partial<Record<ProviderName, string>>): Promise<void> {
  await SecureStore.setItemAsync(ACTIVE_KEY, JSON.stringify(map));
}

// Every saved key lives under its own SecureStore entry (rather than one
// big JSON blob) so the list can grow without bumping into SecureStore's
// per-value size limit — this is what makes the count effectively
// unlimited instead of capped by how many keys fit under ~2KB.
export async function listCredentials(): Promise<SavedCredential[]> {
  const ids = await readIndex();
  const entries = await Promise.all(
    ids.map(async (id) => {
      const raw = await SecureStore.getItemAsync(entryKey(id));
      return raw ? (JSON.parse(raw) as SavedCredential) : null;
    })
  );
  return entries.filter((e): e is SavedCredential => e !== null).sort((a, b) => a.createdAt - b.createdAt);
}

export async function addCredential(
  provider: ProviderName,
  label: string,
  apiKey: string
): Promise<SavedCredential> {
  const credential: SavedCredential = {
    id: generateId(),
    provider,
    label: label.trim() || provider,
    apiKey: apiKey.trim(),
    createdAt: Date.now(),
  };

  const ids = await readIndex();
  await SecureStore.setItemAsync(entryKey(credential.id), JSON.stringify(credential));
  await writeIndex([...ids, credential.id]);

  // First key saved for a provider becomes that provider's active key
  // automatically, so a fresh install only needs "add key" to start working.
  const active = await readActiveMap();
  if (!active[provider]) {
    active[provider] = credential.id;
    await writeActiveMap(active);
  }

  return credential;
}

export async function removeCredential(id: string): Promise<void> {
  const ids = await readIndex();
  const remainingIds = ids.filter((existingId) => existingId !== id);
  await writeIndex(remainingIds);
  await SecureStore.deleteItemAsync(entryKey(id));

  const active = await readActiveMap();
  let changed = false;
  for (const provider of Object.keys(active) as ProviderName[]) {
    if (active[provider] === id) {
      delete active[provider];
      changed = true;
    }
  }
  if (changed) {
    // Promote another key for that provider (if any) so the app doesn't
    // silently go back to "no key configured" when one of several is removed.
    const remaining = await Promise.all(
      remainingIds.map(async (existingId) => {
        const raw = await SecureStore.getItemAsync(entryKey(existingId));
        return raw ? (JSON.parse(raw) as SavedCredential) : null;
      })
    );
    for (const credential of remaining) {
      if (credential && !active[credential.provider]) {
        active[credential.provider] = credential.id;
      }
    }
    await writeActiveMap(active);
  }
}

export async function setActiveCredential(provider: ProviderName, id: string): Promise<void> {
  const active = await readActiveMap();
  active[provider] = id;
  await writeActiveMap(active);
}

export async function getActiveCredentialId(provider: ProviderName): Promise<string | null> {
  const active = await readActiveMap();
  return active[provider] ?? null;
}

// Looks up the active key for a specific provider — this is what the
// API client calls, keyed by whichever provider a given endpoint
// actually needs (openai for transcription, anthropic for
// translation/summarization), not a single app-wide "current provider".
export async function getCredentialsForProvider(
  provider: ProviderName
): Promise<{ provider: ProviderName; apiKey: string } | null> {
  const active = await readActiveMap();
  const id = active[provider];
  if (!id) return null;
  const raw = await SecureStore.getItemAsync(entryKey(id));
  if (!raw) return null;
  const credential = JSON.parse(raw) as SavedCredential;
  return { provider: credential.provider, apiKey: credential.apiKey };
}
