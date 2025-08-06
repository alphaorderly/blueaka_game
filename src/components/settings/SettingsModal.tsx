import React, { useState } from 'react';
import { EventData, CaseOption } from '../../types/calculator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { MessageDisplay } from './components/MessageDisplay';
import { CreateEventSection } from './components/CreateEventSection';
import { ImportExportSection } from './components/ImportExportSection';
import { EventList } from './components/EventList';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    customEvents: EventData[];
    selectedEvent: string;
    // Custom Event Management
    createCustomEvent: (name: string, description?: string) => EventData;
    updateCustomEvent: (eventId: string, updates: Partial<EventData>) => void;
    deleteCustomEvent: (eventId: string) => void;
    setSelectedEvent: (eventId: string) => void;
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
    removeCaseFromCustomEvent: (eventId: string, caseIndex: number) => void;
    updateCaseInCustomEvent: (
        eventId: string,
        caseIndex: number,
        field: keyof CaseOption,
        value: string
    ) => void;
    addObjectToCustomEventCase: (eventId: string, caseIndex: number) => void;
    removeObjectFromCustomEventCase: (
        eventId: string,
        caseIndex: number,
        objectIndex: number
    ) => void;
    updateObjectInCustomEventCase: (
        eventId: string,
        caseIndex: number,
        objectIndex: number,
        field: string,
        value: number
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
    setSelectedEvent,
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
            <DialogContent className="max-h-[85vh] w-[95vw] max-w-5xl overflow-y-auto sm:w-full">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                        커스텀 이벤트 관리
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        커스텀 이벤트를 생성, 편집, 공유할 수 있습니다. 기본
                        이벤트는 수정할 수 없습니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <MessageDisplay message={message} />

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

                    <EventList
                        customEvents={customEvents}
                        selectedEvent={selectedEvent}
                        onSelectEvent={setSelectedEvent}
                        onDeleteEvent={deleteCustomEvent}
                        onExportEvent={handleExportEvent}
                        onExportToClipboard={handleExportToClipboard}
                        onUpdateEvent={updateCustomEvent}
                        onShowMessage={showMessage}
                        onAddCase={addCaseToCustomEvent}
                        onRemoveCase={removeCaseFromCustomEvent}
                        onUpdateCase={updateCaseInCustomEvent}
                        onAddObject={addObjectToCustomEventCase}
                        onRemoveObject={removeObjectFromCustomEventCase}
                        onUpdateObject={updateObjectInCustomEventCase}
                    />
                </div>

                <DialogFooter className="pt-4">
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
