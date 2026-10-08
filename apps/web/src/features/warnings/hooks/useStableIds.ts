import { useMemo } from 'react';

// Ids are joined into a key with a character that never appears in one.
const SEPARATOR = '\n';

// useStableIds returns the same array for the same ids across renders.
// Why: a new array with equal ids would look like a change and reload the data.
// DRY: shared by every hook that loads data for a list of ids.
export function useStableIds(ids: readonly string[]): readonly string[] {
  const key = ids.join(SEPARATOR);
  return useMemo(() => (key ? key.split(SEPARATOR) : []), [key]);
}
