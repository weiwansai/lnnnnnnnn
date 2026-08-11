import type { PreferenceId } from './types';

export interface SharedResult {
  version: 2;
  top9Ids: string[];
  preferenceId: PreferenceId | null;
}

const validPreferences = new Set<PreferenceId>([
  'slow-burn',
  'summer',
  'duet',
  'present',
]);

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSharedResult(result: SharedResult): string {
  return toBase64Url(JSON.stringify(result));
}

export function decodeSharedResult(
  hash: string,
  validIds: ReadonlySet<string>,
): SharedResult | null {
  try {
    const encoded = new URLSearchParams(hash.replace(/^#/, '')).get('result');
    if (!encoded) return null;
    const value = JSON.parse(fromBase64Url(encoded)) as Partial<SharedResult>;
    if (value.version !== 2 || !Array.isArray(value.top9Ids)) return null;
    if (value.top9Ids.length !== 9) return null;
    if (
      new Set(value.top9Ids).size !== 9 ||
      value.top9Ids.some(
        (id) => typeof id !== 'string' || !validIds.has(id),
      )
    ) {
      return null;
    }
    if (
      value.preferenceId !== null &&
      !validPreferences.has(value.preferenceId as PreferenceId)
    ) {
      return null;
    }
    return {
      version: 2,
      top9Ids: value.top9Ids,
      preferenceId: value.preferenceId as PreferenceId | null,
    };
  } catch {
    return null;
  }
}
