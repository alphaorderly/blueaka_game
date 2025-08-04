import { useState, useEffect, useCallback } from 'react';
import {
    CaseOption,
    PlacedObject,
    GridPosition,
    EventData,
    GameObject,
} from '../types/calculator';
import {
    AVAILABLE_EVENTS,
    DEFAULT_EVENT_ID,
    getDefaultEvent,
} from '../consts/events';

export interface CalculatorState {
    selectedEvent: string;
    selectedCase: string;
    caseOptions: CaseOption[];
    openedCells: GridPosition[];
    placedObjects: PlacedObject[];
    autoSave: boolean;
    customEvents: EventData[];
}

const defaultEvent = getDefaultEvent();

const DEFAULT_STATE: CalculatorState = {
    selectedEvent: DEFAULT_EVENT_ID,
    selectedCase: defaultEvent.caseOptions[0]?.value || 'case1',
    caseOptions: defaultEvent.caseOptions,
    openedCells: [],
    placedObjects: [],
    autoSave: true,
    customEvents: [],
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
            if (typeof parsed.selectedEvent === 'string') {
                validState.selectedEvent = parsed.selectedEvent;
            }

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

            if (Array.isArray(parsed.customEvents)) {
                validState.customEvents = parsed.customEvents;
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
    const getAllEvents = useCallback(() => {
        return [...AVAILABLE_EVENTS, ...state.customEvents];
    }, [state.customEvents]);

    const getEventByIdFromAll = useCallback(
        (eventId: string) => {
            const allEvents = getAllEvents();
            return allEvents.find((event) => event.id === eventId);
        },
        [getAllEvents]
    );

    const setSelectedEvent = useCallback(
        (selectedEventId: string) => {
            const eventData =
                getEventByIdFromAll(selectedEventId) || getDefaultEvent();
            setState((prev) => ({
                ...prev,
                selectedEvent: selectedEventId,
                caseOptions: eventData.caseOptions,
                selectedCase: eventData.caseOptions[0]?.value || 'case1',
                openedCells: [],
                placedObjects: [],
            }));
        },
        [getEventByIdFromAll]
    );

    const setSelectedCase = useCallback((selectedCase: string) => {
        setState((prev) => ({
            ...prev,
            selectedCase,
            openedCells: [],
            placedObjects: [],
        }));
    }, []);

    const setCaseOptions = useCallback((caseOptions: CaseOption[]) => {
        setState((prev) => ({ ...prev, caseOptions }));
    }, []);

    const setOpenedCells = useCallback((openedCells: GridPosition[]) => {
        setState((prev) => ({ ...prev, openedCells }));
    }, []);

    const setPlacedObjects = useCallback((placedObjects: PlacedObject[]) => {
        setState((prev) => ({ ...prev, placedObjects }));
    }, []);

    const setAutoSave = useCallback((autoSave: boolean) => {
        setState((prev) => ({ ...prev, autoSave }));
    }, []);

    // Helper functions for common operations
    const clearGridState = useCallback(() => {
        setState((prev) => ({
            ...prev,
            openedCells: [],
            placedObjects: [],
        }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setState(DEFAULT_STATE);
        safeLocalStorage.removeItem(STORAGE_KEY);
    }, []);

    // Custom Event Management
    const createCustomEvent = useCallback(
        (name: string, description?: string) => {
            const newEvent: EventData = {
                id: `custom-${Date.now()}`,
                name,
                description,
                caseOptions: [
                    {
                        value: 'case1',
                        label: '기본 회차',
                        objects: [{ w: 2, h: 1, count: 1, totalCount: 1 }],
                    },
                ],
            };

            setState((prev) => ({
                ...prev,
                customEvents: [...prev.customEvents, newEvent],
            }));

            return newEvent;
        },
        []
    );

    const updateCustomEvent = useCallback(
        (eventId: string, updates: Partial<EventData>) => {
            setState((prev) => ({
                ...prev,
                customEvents: prev.customEvents.map((event) =>
                    event.id === eventId ? { ...event, ...updates } : event
                ),
                // Update current caseOptions if we're editing the currently selected event
                ...(prev.selectedEvent === eventId && updates.caseOptions
                    ? {
                          caseOptions: updates.caseOptions,
                          selectedCase:
                              updates.caseOptions[0]?.value || 'case1',
                          openedCells: [],
                          placedObjects: [],
                      }
                    : {}),
            }));
        },
        []
    );

    const deleteCustomEvent = useCallback((eventId: string) => {
        setState((prev) => {
            const newCustomEvents = prev.customEvents.filter(
                (event) => event.id !== eventId
            );

            // If we're deleting the currently selected event, switch to default
            if (prev.selectedEvent === eventId) {
                const defaultEvent = getDefaultEvent();
                return {
                    ...prev,
                    customEvents: newCustomEvents,
                    selectedEvent: DEFAULT_EVENT_ID,
                    caseOptions: defaultEvent.caseOptions,
                    selectedCase: defaultEvent.caseOptions[0]?.value || 'case1',
                    openedCells: [],
                    placedObjects: [],
                };
            }

            return {
                ...prev,
                customEvents: newCustomEvents,
            };
        });
    }, []);

    const isCustomEvent = useCallback(
        (eventId: string) => {
            return state.customEvents.some((event) => event.id === eventId);
        },
        [state.customEvents]
    ); // Custom Event Import/Export
    const exportCustomEvent = useCallback(
        (eventId: string) => {
            const customEvent = state.customEvents.find(
                (event) => event.id === eventId
            );
            if (!customEvent) {
                throw new Error('Custom event not found');
            }

            const exportData = {
                version: '2.0',
                timestamp: Date.now(),
                eventData: customEvent,
                metadata: {
                    exportedFrom: 'Calculator App',
                    eventName: customEvent.name,
                    description: 'Custom event data for import',
                },
            };
            return JSON.stringify(exportData, null, 2);
        },
        [state.customEvents]
    );

    const importCustomEvent = useCallback((jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);

            // Check if it's event data
            if (!data.eventData || typeof data.eventData !== 'object') {
                throw new Error('Invalid file format: missing eventData');
            }

            const eventData = data.eventData;

            // Validate event data structure
            if (
                !eventData.id ||
                !eventData.name ||
                !Array.isArray(eventData.caseOptions)
            ) {
                throw new Error('Invalid event data structure');
            }

            // Validate case options
            eventData.caseOptions.forEach(
                (caseOption: CaseOption, index: number) => {
                    if (
                        !caseOption.value ||
                        !caseOption.label ||
                        !Array.isArray(caseOption.objects)
                    ) {
                        throw new Error(
                            `Invalid case option at index ${index}`
                        );
                    }

                    caseOption.objects.forEach(
                        (obj: GameObject, objIndex: number) => {
                            if (
                                typeof obj.w !== 'number' ||
                                typeof obj.h !== 'number' ||
                                typeof obj.count !== 'number' ||
                                typeof obj.totalCount !== 'number'
                            ) {
                                throw new Error(
                                    `Invalid object at case ${index}, object ${objIndex}`
                                );
                            }
                        }
                    );
                }
            );

            // Create new event with unique ID
            const newEvent: EventData = {
                ...eventData,
                id: `custom-${Date.now()}`, // Generate new unique ID
                name: `${eventData.name} (가져옴)`, // Mark as imported
            };

            setState((prev) => ({
                ...prev,
                customEvents: [...prev.customEvents, newEvent],
            }));

            return {
                success: true,
                message: `커스텀 이벤트 "${newEvent.name}"를 성공적으로 가져왔습니다!`,
                eventId: newEvent.id,
            };
        } catch (error) {
            console.error('Custom event import failed:', error);
            const message =
                error instanceof Error ? error.message : 'Import failed';
            return { success: false, message: `가져오기 오류: ${message}` };
        }
    }, []);

    // Settings-specific functions (for custom events only)
    const addCaseToCustomEvent = useCallback(
        (eventId: string) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const newCase: CaseOption = {
                value: `case${event.caseOptions.length + 1}`,
                label: `새 회차 ${event.caseOptions.length + 1}`,
                objects: [{ w: 2, h: 1, count: 1, totalCount: 1 }],
            };

            const updatedEvent = {
                ...event,
                caseOptions: [...event.caseOptions, newCase],
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

    const removeCaseFromCustomEvent = useCallback(
        (eventId: string, caseIndex: number) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const newCaseOptions = event.caseOptions.filter(
                (_, i) => i !== caseIndex
            );

            const updatedEvent = {
                ...event,
                caseOptions: newCaseOptions,
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

    const updateCaseInCustomEvent = useCallback(
        (
            eventId: string,
            caseIndex: number,
            field: keyof CaseOption,
            value: string
        ) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const updated = [...event.caseOptions];
            if (field === 'label') {
                updated[caseIndex][field] = value;
                updated[caseIndex].value = `case${caseIndex + 1}`;
            }

            const updatedEvent = {
                ...event,
                caseOptions: updated,
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

    const addObjectToCustomEventCase = useCallback(
        (eventId: string, caseIndex: number) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const updated = [...event.caseOptions];
            updated[caseIndex].objects.push({
                w: 2,
                h: 1,
                count: 1,
                totalCount: 1,
            });

            const updatedEvent = {
                ...event,
                caseOptions: updated,
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

    const removeObjectFromCustomEventCase = useCallback(
        (eventId: string, caseIndex: number, objectIndex: number) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const updated = [...event.caseOptions];
            updated[caseIndex].objects = updated[caseIndex].objects.filter(
                (_, i) => i !== objectIndex
            );

            const updatedEvent = {
                ...event,
                caseOptions: updated,
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

    const updateObjectInCustomEventCase = useCallback(
        (
            eventId: string,
            caseIndex: number,
            objectIndex: number,
            field: string,
            value: number
        ) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const updated = [...event.caseOptions];
            const objectToUpdate = updated[caseIndex].objects[objectIndex];
            (objectToUpdate as unknown as Record<string, unknown>)[field] =
                value;
            if (field === 'totalCount') {
                updated[caseIndex].objects[objectIndex].count = value;
            }

            const updatedEvent = {
                ...event,
                caseOptions: updated,
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

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

        // Available events for selection (built-in + custom)
        availableEvents: getAllEvents(),

        // State setters
        setSelectedEvent,
        setSelectedCase,
        setCaseOptions,
        setOpenedCells,
        setPlacedObjects,
        setAutoSave,

        // Helper functions
        clearGridState,
        resetToDefaults,

        // Custom Event Management
        createCustomEvent,
        updateCustomEvent,
        deleteCustomEvent,
        isCustomEvent,

        // Custom Event Import/Export
        exportCustomEvent,
        importCustomEvent,

        // Custom Event Case/Object Management
        addCaseToCustomEvent,
        removeCaseFromCustomEvent,
        updateCaseInCustomEvent,
        addObjectToCustomEventCase,
        removeObjectFromCustomEventCase,
        updateObjectInCustomEventCase,

        // Utility
        downloadFile,
    };
};
