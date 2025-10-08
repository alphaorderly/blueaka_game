import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    CaseOption,
    PlacedObject,
    GridPosition,
    EventData,
    InventoryObject,
} from '@/types/inventory-management/inventory';
import {
    AVAILABLE_EVENTS,
    DEFAULT_EVENT_ID,
    getDefaultEvent,
} from '@/consts/inventory-management/events';
import { InventoryStateContext } from './InventoryStateContext';

export interface InventoryState {
    selectedEvent: string;
    selectedCase: string;
    caseOptions: CaseOption[];
    openedCells: GridPosition[];
    placedObjects: PlacedObject[];
    autoSave: boolean;
    customEvents: EventData[];
}

const defaultEvent = getDefaultEvent();

const DEFAULT_INVENTORY_STATE: InventoryState = {
    selectedEvent: DEFAULT_EVENT_ID,
    selectedCase: defaultEvent.caseOptions[0]?.value || 'case1',
    caseOptions: defaultEvent.caseOptions,
    openedCells: [],
    placedObjects: [],
    autoSave: true,
    customEvents: [],
};

const STORAGE_KEY = 'inventory_management_state';

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

const loadPersistedState = (): Partial<InventoryState> => {
    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    try {
        const parsed = JSON.parse(stored);

        if (typeof parsed === 'object' && parsed !== null) {
            const validState: Partial<InventoryState> = {};
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

const savePersistedState = (state: InventoryState): void => {
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

const useCreateInventoryState = () => {
    const [state, setState] = useState<InventoryState>(() => {
        const persistedState = loadPersistedState();
        return { ...DEFAULT_INVENTORY_STATE, ...persistedState };
    });

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (isInitialized && state.autoSave) {
            savePersistedState(state);
        }
    }, [state, isInitialized]);

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

    const clearGridState = useCallback(() => {
        setState((prev) => ({
            ...prev,
            openedCells: [],
            placedObjects: [],
        }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setState(DEFAULT_INVENTORY_STATE);
        safeLocalStorage.removeItem(STORAGE_KEY);
    }, []);

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

            if (prev.selectedEvent === eventId) {
                const fallbackEvent = getDefaultEvent();
                return {
                    ...prev,
                    customEvents: newCustomEvents,
                    selectedEvent: DEFAULT_EVENT_ID,
                    caseOptions: fallbackEvent.caseOptions,
                    selectedCase:
                        fallbackEvent.caseOptions[0]?.value || 'case1',
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
    );

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
                    exportedFrom: 'Inventory Manager',
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

            if (!data.eventData || typeof data.eventData !== 'object') {
                throw new Error('Invalid file format: missing eventData');
            }

            const eventData = data.eventData;

            if (
                !eventData.id ||
                !eventData.name ||
                !Array.isArray(eventData.caseOptions)
            ) {
                throw new Error('Invalid event data structure');
            }

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
                        (obj: InventoryObject, objIndex: number) => {
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

            const newEvent: EventData = {
                ...eventData,
                id: `custom-${Date.now()}`,
                name: `${eventData.name} (가져옴)`,
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
        (eventId: string, caseId: string) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const newCaseOptions = event.caseOptions.filter(
                (caseOption) => caseOption.value !== caseId
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
            caseId: string,
            updates: Partial<{ label: string; objects: InventoryObject[] }>
        ) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const caseOptions = [...event.caseOptions];
            const caseIndex = caseOptions.findIndex(
                (caseOption) => caseOption.value === caseId
            );

            if (caseIndex === -1) return;

            caseOptions[caseIndex] = {
                ...caseOptions[caseIndex],
                ...updates,
            };

            const updatedEvent = {
                ...event,
                caseOptions,
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

    const addObjectToCustomEventCase = useCallback(
        (eventId: string, caseId: string) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const caseOptions = [...event.caseOptions];
            const caseIndex = caseOptions.findIndex(
                (caseOption) => caseOption.value === caseId
            );

            if (caseIndex === -1) return;

            caseOptions[caseIndex].objects.push({
                w: 2,
                h: 1,
                count: 1,
                totalCount: 1,
            });

            const updatedEvent = {
                ...event,
                caseOptions,
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

    const removeObjectFromCustomEventCase = useCallback(
        (eventId: string, caseId: string, objectIndex: number) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const caseOptions = [...event.caseOptions];
            const caseIndex = caseOptions.findIndex(
                (caseOption) => caseOption.value === caseId
            );

            if (caseIndex === -1) return;

            caseOptions[caseIndex].objects = caseOptions[
                caseIndex
            ].objects.filter((_, i) => i !== objectIndex);

            const updatedEvent = {
                ...event,
                caseOptions,
            };

            updateCustomEvent(eventId, updatedEvent);
        },
        [state.customEvents, updateCustomEvent]
    );

    const updateObjectInCustomEventCase = useCallback(
        (
            eventId: string,
            caseId: string,
            objectIndex: number,
            updates: Partial<{ w: number; h: number; totalCount: number }>
        ) => {
            const event = state.customEvents.find((e) => e.id === eventId);
            if (!event) return;

            const caseOptions = [...event.caseOptions];
            const caseIndex = caseOptions.findIndex(
                (caseOption) => caseOption.value === caseId
            );

            if (caseIndex === -1) return;

            const objectToUpdate = {
                ...caseOptions[caseIndex].objects[objectIndex],
            };
            Object.assign(objectToUpdate, updates);

            if (updates.totalCount !== undefined) {
                objectToUpdate.count = updates.totalCount;
            }

            caseOptions[caseIndex].objects[objectIndex] = objectToUpdate;

            const updatedEvent = {
                ...event,
                caseOptions,
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
        ...state,
        availableEvents: getAllEvents(),
        setSelectedEvent,
        setSelectedCase,
        setCaseOptions,
        setOpenedCells,
        setPlacedObjects,
        setAutoSave,
        clearGridState,
        resetToDefaults,
        createCustomEvent,
        updateCustomEvent,
        deleteCustomEvent,
        isCustomEvent,
        exportCustomEvent,
        importCustomEvent,
        addCaseToCustomEvent,
        removeCaseFromCustomEvent,
        updateCaseInCustomEvent,
        addObjectToCustomEventCase,
        removeObjectFromCustomEventCase,
        updateObjectInCustomEventCase,
        downloadFile,
    };
};

export type InventoryContextValue = ReturnType<typeof useCreateInventoryState>;

export const InventoryStateProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const value = useCreateInventoryState();

    return (
        <InventoryStateContext.Provider value={value}>
            {children}
        </InventoryStateContext.Provider>
    );
};
