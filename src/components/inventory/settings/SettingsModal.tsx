import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type {
    EventData,
    InventoryObject,
} from '@/types/inventory-management/inventory';
import { DialogShell } from '@/components/ui/DialogShell';
import { CreateEventSection } from '@/components/inventory/settings/components/CreateEventSection';
import { ImportExportSection } from '@/components/inventory/settings/components/ImportExportSection';
import { EventList } from '@/components/inventory/settings/components/EventList';
import { EventListItem } from '@/components/inventory/settings/components/EventListItem';

interface SettingsModalProps {
    trigger: React.ReactNode;
    customEvents: EventData[];
    selectedEvent: string;
    createCustomEvent: (name: string, description?: string) => EventData;
    updateCustomEvent: (eventId: string, updates: Partial<EventData>) => void;
    deleteCustomEvent: (eventId: string) => void;
    exportCustomEvent: (eventId: string) => string;
    importCustomEvent: (jsonString: string) => {
        success: boolean;
        message: string;
        eventId?: string;
    };
    downloadFile: (content: string, filename: string) => void;
    addCaseToCustomEvent: (eventId: string) => void;
    removeCaseFromCustomEvent: (eventId: string, caseId: string) => void;
    updateCaseInCustomEvent: (
        eventId: string,
        caseId: string,
        updates: Partial<{ label: string; objects: InventoryObject[] }>
    ) => void;
    addObjectToCustomEventCase: (eventId: string, caseId: string) => void;
    removeObjectFromCustomEventCase: (
        eventId: string,
        caseId: string,
        objectIndex: number
    ) => void;
    updateObjectInCustomEventCase: (
        eventId: string,
        caseId: string,
        objectIndex: number,
        updates: Partial<{ w: number; h: number; totalCount: number }>
    ) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    trigger,
    customEvents,
    selectedEvent,
    createCustomEvent,
    updateCustomEvent,
    deleteCustomEvent,
    exportCustomEvent,
    importCustomEvent,
    downloadFile,
    addCaseToCustomEvent,
    removeCaseFromCustomEvent,
    updateCaseInCustomEvent,
    addObjectToCustomEventCase,
    removeObjectFromCustomEventCase,
    updateObjectInCustomEventCase,
}) => {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        if (!customEvents.some((event) => event.id === activeId)) {
            setActiveId(customEvents[0]?.id ?? '');
        }
    }, [customEvents, activeId]);

    const activeEvent = customEvents.find((event) => event.id === activeId);

    const handleCreate = (name: string) => {
        const created = createCustomEvent(name);
        setActiveId(created.id);
    };

    const handleImport = (json: string) => {
        const result = importCustomEvent(json);
        if (result.success) {
            toast.success(result.message);
            if (result.eventId) setActiveId(result.eventId);
        } else {
            toast.error(result.message);
        }
        return result.success;
    };

    const handleExportFile = (eventId: string) => {
        try {
            const exportData = exportCustomEvent(eventId);
            const event = customEvents.find((e) => e.id === eventId);
            const filename = `custom-event-${event?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
            downloadFile(exportData, filename);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('내보내기 실패');
        }
    };

    const handleCopy = async (eventId: string) => {
        try {
            await navigator.clipboard.writeText(exportCustomEvent(eventId));
            toast.success('복사됨');
        } catch (error) {
            console.error('Clipboard error:', error);
            toast.error('복사 실패');
        }
    };

    const handleDelete = (eventId: string) => {
        const event = customEvents.find((e) => e.id === eventId);
        if (!event) return;
        if (window.confirm(`"${event.name}" 이벤트를 삭제할까요?`)) {
            deleteCustomEvent(event.id);
        }
    };

    return (
        <DialogShell
            title="커스텀 이벤트"
            contentClassName="h-[min(720px,90vh)] sm:max-w-4xl"
            bodyClassName="grid overflow-hidden md:grid-cols-[240px_minmax(0,1fr)]"
            content={
                <>
                    <aside className="bg-sunken flex min-h-0 flex-col border-b md:border-r md:border-b-0">
                        <div className="border-b p-3">
                            <CreateEventSection onCreateEvent={handleCreate} />
                        </div>
                        <div className="max-h-40 min-h-0 flex-1 overflow-y-auto p-1.5 md:max-h-none">
                            <EventList
                                customEvents={customEvents}
                                activeId={activeId}
                                selectedEvent={selectedEvent}
                                onSelect={setActiveId}
                            />
                        </div>
                        <div className="border-t p-3">
                            <ImportExportSection onImportEvent={handleImport} />
                        </div>
                    </aside>

                    <div className="min-h-0 overflow-y-auto">
                        {activeEvent ? (
                            <EventListItem
                                key={activeEvent.id}
                                event={activeEvent}
                                onUpdateEvent={updateCustomEvent}
                                onExportFile={handleExportFile}
                                onCopy={handleCopy}
                                onDelete={handleDelete}
                                onAddCase={addCaseToCustomEvent}
                                onRemoveCase={removeCaseFromCustomEvent}
                                onUpdateCase={updateCaseInCustomEvent}
                                onAddObject={addObjectToCustomEventCase}
                                onRemoveObject={removeObjectFromCustomEventCase}
                                onUpdateObject={updateObjectInCustomEventCase}
                            />
                        ) : (
                            <div className="text-faint flex h-full min-h-48 items-center justify-center text-[13px]">
                                이벤트 없음
                            </div>
                        )}
                    </div>
                </>
            }
        >
            {trigger}
        </DialogShell>
    );
};
