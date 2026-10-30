export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatCoins(amount: number, qualifier?: string): string {
  return [String(amount), qualifier, amount === 1 ? 'coin' : 'coins'].filter(Boolean).join(' ');
}
