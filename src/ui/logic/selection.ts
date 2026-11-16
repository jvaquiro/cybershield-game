/**
 * Next selection after tapping a control. Tapping a selected control removes it. With budget 1 a
 * new tap replaces the current choice; with a larger budget, taps beyond the budget are ignored.
 */
export function toggleSelection(selected: readonly string[], id: string, budget: number): string[] {
  if (selected.includes(id)) return selected.filter((item) => item !== id);
  if (budget === 1) return [id];
  if (selected.length >= budget) return [...selected];
  return [...selected, id];
}
