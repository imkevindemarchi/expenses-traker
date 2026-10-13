type TLoaderListener = () => void;

let activeLoaders = 0;
const listeners = new Set<TLoaderListener>();

const emitChange = (): void => {
  listeners.forEach((listener: TLoaderListener): void => {
    listener();
  });
};

export const startGlobalLoading = (): void => {
  activeLoaders += 1;
  emitChange();
};

export const stopGlobalLoading = (): void => {
  activeLoaders = Math.max(0, activeLoaders - 1);
  emitChange();
};

export const getGlobalLoaderSnapshot = (): boolean => {
  return activeLoaders > 0;
};

export const subscribeGlobalLoader = (listener: TLoaderListener): (() => void) => {
  listeners.add(listener);

  return (): void => {
    listeners.delete(listener);
  };
};

export const runWithGlobalLoading = async <T>(operation: () => Promise<T>): Promise<T> => {
  startGlobalLoading();

  try {
    return await operation();
  } finally {
    stopGlobalLoading();
  }
};
