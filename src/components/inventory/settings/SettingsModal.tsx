import React from 'react';
import {
    EventData,
    InventoryObject,
} from '@/types/inventory-management/inventory';
import { DialogShell } from '@/components/ui/DialogShell';
import { CreateEventSection } from '@/components/inventory/settings/components/CreateEventSection';
import { ImportExportSection } from '@/components/inventory/settings/components/ImportExportSection';
import { EventList } from '@/components/inventory/settings/components/EventList';
import toast from 'react-hot-toast';

interface SettingsModalProps {
    trigger: React.ReactNode;
    customEvents: EventData[];
    selectedEvent: string;
    // Custom Event Management
    createCustomEvent: (name: string, description?: string) => EventData;
    updateCustomEvent: (eventId: string, updates: Partial<EventData>) => void;
    deleteCustomEvent: (eventId: string) => void;
    // Import/Export
    exportCustomEvent: (eventId: string) => string;
    importCustomEvent: (jsonString: string) => {
        success: boolean;
        message: string;
        eventId?: string;
    };
    downloadFile: (content: string, filename: string) => void;
    // Case/Object Management for Custom Events
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
    const handleExportEvent = (eventId: string) => {
        try {
            const exportData = exportCustomEvent(eventId);
            const event = customEvents.find((e) => e.id === eventId);
            const filename = `custom-event-${event?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
            downloadFile(exportData, filename);
            toast.success('커스텀 이벤트가 성공적으로 내보내졌습니다!');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('내보내기에 실패했습니다.');
        }
    };

    const handleExportToClipboard = async (eventId: string) => {
        try {
            const exportData = exportCustomEvent(eventId);
            await navigator.clipboard.writeText(exportData);
            toast.success('커스텀 이벤트 데이터가 클립보드에 복사되었습니다!');
        } catch (error) {
            toast.error(
                '클립보드 복사에 실패했습니다. 파일 다운로드를 이용해주세요.'
            );
            console.error('Clipboard error:', error);
        }
    };

    return (
        <DialogShell
            title="커스텀 이벤트 관리"
            bodyClassName="px-4"
            content={
                <div className="space-y-6">
                    <div className="flex flex-col">
                        <CreateEventSection onCreateEvent={createCustomEvent} />

                        <ImportExportSection
                            onImportEvent={importCustomEvent}
                        />
                    </div>

                    <EventList
                        customEvents={customEvents}
                        selectedEvent={selectedEvent}
                        onDeleteEvent={deleteCustomEvent}
                        onExportEvent={handleExportEvent}
                        onExportToClipboard={handleExportToClipboard}
                        onUpdateEvent={updateCustomEvent}
                        onAddCase={addCaseToCustomEvent}
                        onRemoveCase={removeCaseFromCustomEvent}
                        onUpdateCase={updateCaseInCustomEvent}
                        onAddObject={addObjectToCustomEventCase}
                        onRemoveObject={removeObjectFromCustomEventCase}
                        onUpdateObject={updateObjectInCustomEventCase}
                    />

                    <div className="w-[0px]"></div>
                </div>
            }
        >
            {trigger}
        </DialogShell>
    );
};
