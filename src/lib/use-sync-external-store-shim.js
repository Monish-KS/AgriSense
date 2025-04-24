// This file serves as a shim for the use-sync-external-store package
// It re-exports the necessary functions for compatibility with libraries like @react-three/fiber.
import { useSyncExternalStore } from 'use-sync-external-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

// Re-export the named exports
export { useSyncExternalStore, useSyncExternalStoreWithSelector };

// Provide useSyncExternalStoreWithSelector as the default export for compatibility
export default useSyncExternalStoreWithSelector;