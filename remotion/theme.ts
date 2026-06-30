export type CategoryStyle = { color: string; icon: string };

const STYLES: Record<string, CategoryStyle> = {
  'Roster Move': { color: '#f59e0b', icon: '🔁' },
  'Match Result': { color: '#22c55e', icon: '🏆' },
  Patch: { color: '#3b82f6', icon: '🛠️' },
  Event: { color: '#a855f7', icon: '📅' },
  Drama: { color: '#ef4444', icon: '🔥' },
  Transfer: { color: '#06b6d4', icon: '✈️' },
};

const DEFAULT_STYLE: CategoryStyle = { color: '#64748b', icon: '📰' };

export function categoryStyle(category: string): CategoryStyle {
  return STYLES[category] ?? DEFAULT_STYLE;
}
