import { useState, useEffect, useCallback } from 'react';
import { CaseOption, PlacedObject, GridPosition } from '../types/calculator';
import { CASE_OPTIONS } from '../consts/gameData';

export interface CalculatorState {
  selectedCase: string;
  caseOptions: CaseOption[];
  openedCells: GridPosition[];
  placedObjects: PlacedObject[];
  autoSave: boolean;
}

const DEFAULT_STATE: CalculatorState = {
  selectedCase: 'case1',
  caseOptions: CASE_OPTIONS,
  openedCells: [],
  placedObjects: [],
  autoSave: true,
};

const STORAGE_KEY = 'calculator_persistent_state';

// Safe localStorage operations with error handling
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('LocalStorage getItem failed:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('LocalStorage setItem failed:', error);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('LocalStorage removeItem failed:', error);
    }
  },
};

const loadPersistedState = (): Partial<CalculatorState> => {
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored);
    
    // Validate the loaded state structure
    if (typeof parsed === 'object' && parsed !== null) {
      const validState: Partial<CalculatorState> = {};
      
      if (typeof parsed.selectedCase === 'string') {
        validState.selectedCase = parsed.selectedCase;
      }
      
      if (Array.isArray(parsed.caseOptions)) {
        validState.caseOptions = parsed.caseOptions;
      }
      
      if (Array.isArray(parsed.openedCells)) {
        validState.openedCells = parsed.openedCells;
      }
      
      if (Array.isArray(parsed.placedObjects)) {
        validState.placedObjects = parsed.placedObjects;
      }
      
      if (typeof parsed.autoSave === 'boolean') {
        validState.autoSave = parsed.autoSave;
      }
      
      return validState;
    }
  } catch (error) {
    console.warn('Failed to parse persisted state:', error);
  }
  
  return {};
};

const savePersistedState = (state: CalculatorState): void => {
  try {
    const stateToSave = {
      ...state,
      timestamp: Date.now(),
    };
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('Failed to save persisted state:', error);
  }
};

export const useCalculatorState = () => {
  // Initialize state with persisted data only once
  const [state, setState] = useState<CalculatorState>(() => {
    const persistedState = loadPersistedState();
    return { ...DEFAULT_STATE, ...persistedState };
  });
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Mark as initialized after first render to prevent overwriting with defaults
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Persist state whenever it changes (but only if autoSave is enabled and after initialization)
  useEffect(() => {
    if (isInitialized && state.autoSave) {
      savePersistedState(state);
    }
  }, [state, isInitialized]);
  // Individual setters for each piece of state
  const setSelectedCase = useCallback((selectedCase: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedCase,
      openedCells: [],
      placedObjects: []
    }));
  }, []);

  const setCaseOptions = useCallback((caseOptions: CaseOption[]) => {
    setState(prev => ({ ...prev, caseOptions }));
  }, []);

  const setOpenedCells = useCallback((openedCells: GridPosition[]) => {
    setState(prev => ({ ...prev, openedCells }));
  }, []);

  const setPlacedObjects = useCallback((placedObjects: PlacedObject[]) => {
    setState(prev => ({ ...prev, placedObjects }));
  }, []);

  const setAutoSave = useCallback((autoSave: boolean) => {
    setState(prev => ({ ...prev, autoSave }));
  }, []);

  // Helper functions for common operations
  const clearGridState = useCallback(() => {
    setState(prev => ({
      ...prev,
      openedCells: [],
      placedObjects: []
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setState(DEFAULT_STATE);
    safeLocalStorage.removeItem(STORAGE_KEY);
  }, []);  // Case options only export/import (for sharing)
  const exportCaseOptions = useCallback(() => {
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      caseOptions: state.caseOptions,
      metadata: {
        exportedFrom: 'Calculator App',
        totalCases: state.caseOptions.length,
        description: 'Case options only - for sharing custom cases'
      }
    };
    return JSON.stringify(exportData, null, 2);
  }, [state.caseOptions]);

  const importCaseOptions = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      
      // Check if it's case options data
      if (!data.caseOptions || !Array.isArray(data.caseOptions)) {
        throw new Error('Invalid file format: missing caseOptions array');
      }

      // Validate case options
      data.caseOptions.forEach((caseOption: any, index: number) => {
        if (!caseOption.value || !caseOption.label || !Array.isArray(caseOption.objects)) {
          throw new Error(`Invalid case option at index ${index}`);
        }
        
        caseOption.objects.forEach((obj: any, objIndex: number) => {
          if (typeof obj.w !== 'number' || typeof obj.h !== 'number' || 
              typeof obj.count !== 'number' || typeof obj.totalCount !== 'number') {
            throw new Error(`Invalid object at case ${index}, object ${objIndex}`);
          }
        });
      });

      // Import case options and reset to first case
      const newCaseOptions = data.caseOptions;
      const newSelectedCase = newCaseOptions[0]?.value || 'case1';

      setState(prev => ({ 
        ...prev, 
        caseOptions: newCaseOptions,
        selectedCase: newSelectedCase,
        // Clear grid when importing new case options
        openedCells: [],
        placedObjects: []
      }));
      return { success: true, message: '케이스 설정을 성공적으로 가져왔습니다!' };
    } catch (error) {
      console.error('Case options import failed:', error);
      const message = error instanceof Error ? error.message : 'Import failed';
      return { success: false, message: `가져오기 오류: ${message}` };
    }
  }, []);

  // Settings-specific functions
  const addCase = useCallback(() => {
    const newCase: CaseOption = {
      value: `case${state.caseOptions.length + 1}`,
      label: `새 회차 ${state.caseOptions.length + 1}`,
      objects: [
        { w: 2, h: 1, count: 1, totalCount: 1 }
      ]
    };
    setState(prev => ({ 
      ...prev, 
      caseOptions: [...prev.caseOptions, newCase] 
    }));
  }, [state.caseOptions.length]);

  const removeCase = useCallback((index: number) => {
    const newCaseOptions = state.caseOptions.filter((_, i) => i !== index);
    // If we're removing the current case, switch to the first available case
    const newSelectedCase = newCaseOptions.find(option => option.value === state.selectedCase)
      ? state.selectedCase
      : newCaseOptions[0]?.value || 'case1';
    
    setState(prev => ({ 
      ...prev, 
      caseOptions: newCaseOptions,
      selectedCase: newSelectedCase,
      // Clear grid when removing cases
      openedCells: [],
      placedObjects: []
    }));
  }, [state.caseOptions, state.selectedCase]);

  const updateCase = useCallback((index: number, field: keyof CaseOption, value: string) => {
    const updated = [...state.caseOptions];
    if (field === 'label') {
      updated[index][field] = value;
      // Auto-generate value from label
      updated[index].value = `case${index + 1}`;
    }
    setState(prev => ({ ...prev, caseOptions: updated }));
  }, [state.caseOptions]);

  const addObjectToCase = useCallback((caseIndex: number) => {
    const updated = [...state.caseOptions];
    updated[caseIndex].objects.push({ w: 2, h: 1, count: 1, totalCount: 1 });
    setState(prev => ({ ...prev, caseOptions: updated }));
  }, [state.caseOptions]);

  const removeObjectFromCase = useCallback((caseIndex: number, objectIndex: number) => {
    const updated = [...state.caseOptions];
    updated[caseIndex].objects = updated[caseIndex].objects.filter((_, i) => i !== objectIndex);
    setState(prev => ({ ...prev, caseOptions: updated }));
  }, [state.caseOptions]);
  const updateObjectInCase = useCallback((caseIndex: number, objectIndex: number, field: string, value: number) => {
    const updated = [...state.caseOptions];
    (updated[caseIndex].objects[objectIndex] as any)[field] = value;
    // Sync count with totalCount when totalCount changes
    if (field === 'totalCount') {
      updated[caseIndex].objects[objectIndex].count = value;
    }
    setState(prev => ({ ...prev, caseOptions: updated }));
  }, [state.caseOptions]);

  const resetCaseOptions = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      caseOptions: CASE_OPTIONS,
      selectedCase: CASE_OPTIONS[0]?.value || 'case1',
      // Clear grid when resetting case options
      openedCells: [],
      placedObjects: []
    }));
  }, []);

  const downloadFile = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);
  return {
    // State values
    ...state,
    
    // State setters
    setSelectedCase,
    setCaseOptions,
    setOpenedCells,
    setPlacedObjects,
    setAutoSave,
    
    // Helper functions
    clearGridState,
    resetToDefaults,    // Import/Export
    exportCaseOptions,
    importCaseOptions,
    downloadFile,    // Settings functions
    addCase,
    removeCase,
    updateCase,
    addObjectToCase,
    removeObjectFromCase,
    updateObjectInCase,
    resetCaseOptions,
  };
};
