/** Deduplicate speculative imports; allow another attempt after failure. */
export function createPreloader<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => pending ??= load().catch((error) => { pending = undefined; throw error; });
}
