import React, { useState } from 'react';
import {
    EventData,
    InventoryObject,
} from '@/types/inventory-management/inventory';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageDisplay } from '@/components/inventory/settings/components/MessageDisplay';
import { CreateEventSection } from '@/components/inventory/settings/components/CreateEventSection';
import { ImportExportSection } from '@/components/inventory/settings/components/ImportExportSection';
import { EventList } from '@/components/inventory/settings/components/EventList';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
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
    isOpen,
    onClose,
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
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const clearMessage = () => {
        setMessage(null);
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(clearMessage, 5000);
    };

    // Auto-select newly created or imported events if needed
    const handleEventCreated = () => {
        // Could implement auto-selection logic here
    };

    const handleEventImported = () => {
        // Could implement auto-selection logic here
    };

    const handleExportEvent = (eventId: string) => {
        try {
            const exportData = exportCustomEvent(eventId);
            const event = customEvents.find((e) => e.id === eventId);
            const filename = `custom-event-${event?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
            downloadFile(exportData, filename);
            showMessage(
                'success',
                '커스텀 이벤트가 성공적으로 내보내졌습니다!'
            );
        } catch (error) {
            console.error('Export failed:', error);
            showMessage('error', '내보내기에 실패했습니다.');
        }
    };

    const handleExportToClipboard = async (eventId: string) => {
        try {
            const exportData = exportCustomEvent(eventId);
            await navigator.clipboard.writeText(exportData);
            showMessage(
                'success',
                '커스텀 이벤트 데이터가 클립보드에 복사되었습니다!'
            );
        } catch (error) {
            showMessage(
                'error',
                '클립보드 복사에 실패했습니다. 파일 다운로드를 이용해주세요.'
            );
            console.error('Clipboard error:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden">
                <DialogHeader className="border-border/60 dark:border-border/40 border-b pb-4">
                    <DialogTitle className="text-foreground text-xl font-semibold">
                        커스텀 이벤트 관리
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-1">
                        <MessageDisplay message={message} />

                        <div className="flex flex-col gap-6">
                            <CreateEventSection
                                onCreateEvent={createCustomEvent}
                                onShowMessage={showMessage}
                                onEventCreated={handleEventCreated}
                            />

                            <ImportExportSection
                                onImportEvent={importCustomEvent}
                                onShowMessage={showMessage}
                                onEventImported={handleEventImported}
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
                    </div>
                </div>

                <DialogFooter className="border-border/60 dark:border-border/40 mt-4 border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto"
                    >
                        닫기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
