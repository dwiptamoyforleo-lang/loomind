import { UploadedFile, DocumentSummary, ChatMessage, UserSettings, GoogleUserProfile, ChunkItem } from '../types';

// The Google OAuth Client ID provided for Loomind
export const GOOGLE_CLIENT_ID = '83329903372-4cr45b209hd4c0e679ehu0br3fpcqbpq.apps.googleusercontent.com';

const AUTH_USER_KEY = 'loomind_auth_user';

// Clean up any old un-namespaced keys from prior versions to prevent data leakage
export function purgeLegacyGlobalStorage() {
  try {
    localStorage.removeItem('loomind_sources');
    localStorage.removeItem('loomind_chunk_index');
    localStorage.removeItem('loomind_gemini_api_key');
    localStorage.removeItem('loomind_chat');
    localStorage.removeItem('loomind_summary');
    localStorage.removeItem('loomind_settings');
  } catch (e) {
    console.warn('Storage purge error:', e);
  }
}

// Safely decode Google Identity Services credential JWT
export function decodeGoogleJwt(credential: string): GoogleUserProfile | null {
  try {
    const parts = credential.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const data = JSON.parse(jsonPayload);
    if (!data.sub) return null;

    return {
      sub: data.sub,
      email: data.email || '',
      name: data.name || data.given_name || 'Google User',
      given_name: data.given_name,
      family_name: data.family_name,
      picture: data.picture,
      email_verified: data.email_verified,
    };
  } catch (err) {
    console.error('Error decoding Google JWT credential:', err);
    return null;
  }
}

// Authentication Session Management
export function getSavedAuthUser(): GoogleUserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user && user.sub) return user;
    return null;
  } catch {
    return null;
  }
}

export function saveAuthUser(user: GoogleUserProfile): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save auth session:', e);
  }
}

export function clearAuthUser(): void {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (e) {
    console.error('Failed to clear auth session:', e);
  }
}

// User-Specific Storage Key Generators
export function getSourcesKey(sub: string): string {
  return `loomind_sources_${sub}`;
}

export function getChunkIndexKey(sub: string): string {
  return `loomind_chunk_index_${sub}`;
}

export function getChatKey(sub: string): string {
  return `loomind_chat_${sub}`;
}

export function getSummaryKey(sub: string): string {
  return `loomind_summary_${sub}`;
}

export function getSuggestedQuestionsKey(sub: string): string {
  return `loomind_suggested_questions_${sub}`;
}

export function getSettingsKey(sub: string): string {
  return `loomind_settings_${sub}`;
}

export function getApiKeyStorageKey(sub: string): string {
  return `loomind_api_key_${sub}`;
}

// Sources (Files)
export function loadUserSources(sub: string): UploadedFile[] {
  if (!sub) return [];
  try {
    const raw = localStorage.getItem(getSourcesKey(sub));
    if (!raw) return [];
    return JSON.parse(raw) as UploadedFile[];
  } catch (e) {
    console.error(`Error loading sources for sub ${sub}:`, e);
    return [];
  }
}

export function saveUserSources(sub: string, sources: UploadedFile[]): void {
  if (!sub) return;
  try {
    localStorage.setItem(getSourcesKey(sub), JSON.stringify(sources));
    // Also build and maintain the chunk index for this user
    rebuildAndSaveChunkIndex(sub, sources);
  } catch (e) {
    console.error(`Error saving sources for sub ${sub}:`, e);
  }
}

// Chunk Indexing
function simpleChunkText(text: string, chunkSize: number = 800): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + chunkSize));
    index += chunkSize - 100; // 100-character overlap
  }
  return chunks;
}

export function rebuildAndSaveChunkIndex(sub: string, sources: UploadedFile[]): void {
  if (!sub) return;
  try {
    const chunks: ChunkItem[] = [];
    for (const source of sources) {
      if (source.textContent) {
        const textPieces = simpleChunkText(source.textContent);
        textPieces.forEach((piece, idx) => {
          chunks.push({
            id: `${source.id}_chunk_${idx}`,
            fileId: source.id,
            fileName: source.name,
            chunkIndex: idx,
            text: piece,
          });
        });
      }
    }
    localStorage.setItem(getChunkIndexKey(sub), JSON.stringify(chunks));
  } catch (e) {
    console.error(`Error saving chunk index for sub ${sub}:`, e);
  }
}

export function loadUserChunkIndex(sub: string): ChunkItem[] {
  if (!sub) return [];
  try {
    const raw = localStorage.getItem(getChunkIndexKey(sub));
    if (!raw) return [];
    return JSON.parse(raw) as ChunkItem[];
  } catch (e) {
    console.error(`Error loading chunk index for sub ${sub}:`, e);
    return [];
  }
}

// Chat Messages
export function loadUserChat(sub: string): ChatMessage[] {
  if (!sub) return [];
  try {
    const raw = localStorage.getItem(getChatKey(sub));
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch (e) {
    console.error(`Error loading chat for sub ${sub}:`, e);
    return [];
  }
}

export function saveUserChat(sub: string, messages: ChatMessage[]): void {
  if (!sub) return;
  try {
    localStorage.setItem(getChatKey(sub), JSON.stringify(messages));
  } catch (e) {
    console.error(`Error saving chat for sub ${sub}:`, e);
  }
}

// Document Summary
export function loadUserSummary(sub: string): DocumentSummary | null {
  if (!sub) return null;
  try {
    const raw = localStorage.getItem(getSummaryKey(sub));
    if (!raw) return null;
    return JSON.parse(raw) as DocumentSummary;
  } catch (e) {
    console.error(`Error loading summary for sub ${sub}:`, e);
    return null;
  }
}

export function saveUserSummary(sub: string, summary: DocumentSummary | null): void {
  if (!sub) return;
  try {
    if (summary === null) {
      localStorage.removeItem(getSummaryKey(sub));
    } else {
      localStorage.setItem(getSummaryKey(sub), JSON.stringify(summary));
    }
  } catch (e) {
    console.error(`Error saving summary for sub ${sub}:`, e);
  }
}

// Suggested Questions
export function loadUserSuggestedQuestions(sub: string): string[] {
  if (!sub) return [];
  try {
    const raw = localStorage.getItem(getSuggestedQuestionsKey(sub));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    console.error(`Error loading suggested questions for sub ${sub}:`, e);
    return [];
  }
}

export function saveUserSuggestedQuestions(sub: string, questions: string[]): void {
  if (!sub) return;
  try {
    localStorage.setItem(getSuggestedQuestionsKey(sub), JSON.stringify(questions));
  } catch (e) {
    console.error(`Error saving suggested questions for sub ${sub}:`, e);
  }
}

// Settings
export function loadUserSettings(sub: string): UserSettings {
  if (!sub) return {};
  try {
    const raw = localStorage.getItem(getSettingsKey(sub));
    if (!raw) return {};
    return JSON.parse(raw) as UserSettings;
  } catch (e) {
    console.error(`Error loading settings for sub ${sub}:`, e);
    return {};
  }
}

export function saveUserSettings(sub: string, settings: UserSettings): void {
  if (!sub) return;
  try {
    localStorage.setItem(getSettingsKey(sub), JSON.stringify(settings));
  } catch (e) {
    console.error(`Error saving settings for sub ${sub}:`, e);
  }
}

// Gemini API Key (Isolated per account)
export function loadUserApiKey(sub: string): string | null {
  if (!sub) return null;
  try {
    return localStorage.getItem(getApiKeyStorageKey(sub));
  } catch (e) {
    console.error(`Error loading API key for sub ${sub}:`, e);
    return null;
  }
}

export function saveUserApiKey(sub: string, key: string): void {
  if (!sub) return;
  try {
    localStorage.setItem(getApiKeyStorageKey(sub), key);
  } catch (e) {
    console.error(`Error saving API key for sub ${sub}:`, e);
  }
}

export function clearUserApiKey(sub: string): void {
  if (!sub) return;
  try {
    localStorage.removeItem(getApiKeyStorageKey(sub));
  } catch (e) {
    console.error(`Error clearing API key for sub ${sub}:`, e);
  }
}
