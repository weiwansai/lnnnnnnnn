import { describe, expect, it } from 'vitest';
import { decodeSharedResult, encodeSharedResult } from './shareCodec';

const validIds = Array.from({ length: 48 }, (_, index) => `item-${index + 1}`);
const validIdSet = new Set(validIds);

describe('shared result codec', () => {
  it('round-trips nine item IDs and a preference', () => {
    const result = {
      version: 2 as const,
      top9Ids: validIds.slice(0, 9),
      preferenceId: 'summer' as const,
    };
    const encoded = encodeSharedResult(result);
    expect(decodeSharedResult(`#result=${encoded}`, validIdSet)).toEqual(result);
  });

  it('accepts a fallback result', () => {
    const result = {
      version: 2 as const,
      top9Ids: validIds.slice(0, 9),
      preferenceId: null,
    };
    const encoded = encodeSharedResult(result);
    expect(decodeSharedResult(`#result=${encoded}`, validIdSet)).toEqual(result);
  });

  it('rejects malformed, duplicate, unknown, and legacy results', () => {
    expect(decodeSharedResult('#result=bad', validIdSet)).toBeNull();
    const duplicate = encodeSharedResult({
      version: 2,
      top9Ids: Array(9).fill(validIds[0]),
      preferenceId: 'duet',
    });
    expect(decodeSharedResult(`#result=${duplicate}`, validIdSet)).toBeNull();
    const unknown = encodeSharedResult({
      version: 2,
      top9Ids: [...validIds.slice(0, 8), 'unknown'],
      preferenceId: 'duet',
    });
    expect(decodeSharedResult(`#result=${unknown}`, validIdSet)).toBeNull();

    const legacyPayload = btoa(
      JSON.stringify({
        version: 1,
        top7Ids: validIds.slice(0, 7),
        preferenceId: 'duet',
      }),
    );
    expect(
      decodeSharedResult(`#result=${legacyPayload}`, validIdSet),
    ).toBeNull();
  });
});
