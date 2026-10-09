export function budgetStatus(limit: number, spent: number) {
  const ratio = limit === 0 ? (spent === 0 ? 0 : Infinity) : spent / limit;
  return { remaining: limit - spent, progress: Math.min(100, Math.max(0, ratio * 100)), emoji: ratio > 1 ? '🚨' : ratio >= .8 ? '😟' : ratio >= .5 ? '😐' : '😊', message: ratio > 1 ? 'Hai superato il limite mensile.' : ratio >= .8 ? 'Ti stai avvicinando al limite.' : ratio >= .5 ? 'Hai utilizzato almeno metà del budget.' : 'Il tuo budget è sotto controllo.' };
}
