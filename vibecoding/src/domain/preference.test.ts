import { describe, expect, it } from 'vitest';
import { selectPreference } from './preference';
import type { CandyItem, PreferenceId } from './types';

const item = (id: string, preferenceId: PreferenceId): CandyItem => ({
  id,
  title: id,
  description: null,
  preferenceId,
});

describe('selectPreference', () => {
  it('selects a category that appears at least four times in the TOP 9', () => {
    const top9 = [
      item('a', 'summer'),
      item('b', 'summer'),
      item('c', 'summer'),
      item('d', 'summer'),
      item('e', 'duet'),
      item('f', 'duet'),
      item('g', 'present'),
      item('h', 'present'),
      item('i', 'slow-burn'),
    ];

    expect(selectPreference(top9, 'a')).toEqual({
      id: 'summer',
      count: 4,
      fallback: false,
    });
  });

  it('uses the champion category to break an equal qualifying tie', () => {
    const top9 = [
      item('a', 'duet'),
      item('b', 'duet'),
      item('c', 'duet'),
      item('d', 'duet'),
      item('e', 'summer'),
      item('f', 'summer'),
      item('g', 'summer'),
      item('h', 'summer'),
      item('i', 'present'),
    ];

    expect(selectPreference(top9, 'a').id).toBe('duet');
  });

  it('returns fallback when every category is below four', () => {
    const top9 = [
      item('a', 'slow-burn'),
      item('b', 'slow-burn'),
      item('c', 'slow-burn'),
      item('d', 'summer'),
      item('e', 'summer'),
      item('f', 'duet'),
      item('g', 'duet'),
      item('h', 'present'),
      item('i', 'present'),
    ];

    expect(selectPreference(top9, 'a')).toEqual({
      id: null,
      count: 0,
      fallback: true,
    });
  });
});
