import { useContext } from 'react';
import { InventoryStateContext } from './InventoryStateContext';
import type { InventoryContextValue } from './useInventoryState';

export const useInventory = (): InventoryContextValue => {
    const context = useContext(InventoryStateContext);

    if (!context) {
        throw new Error(
            'useInventory must be used within an InventoryStateProvider'
        );
    }

    return context;
};
