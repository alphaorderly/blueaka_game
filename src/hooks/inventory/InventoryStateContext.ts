import { createContext } from 'react';
import type { InventoryContextValue } from './useInventoryState';

export const InventoryStateContext =
    createContext<InventoryContextValue | null>(null);
