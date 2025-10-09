import React, { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    EventData,
    InventoryObject,
} from '@/types/inventory-management/inventory';
import { EventListItem } from '@/components/inventory/settings/components/EventListItem';
import { Button } from '@/components/ui/button';
import { Copy, Download, Trash2 } from 'lucide-react';

interface EventListProps {
    customEvents: EventData[];
    selectedEvent: string;
    onDeleteEvent: (eventId: string) => void;
    onExportEvent: (eventId: string) => void;
    onExportToClipboard: (eventId: string) => void;
    onUpdateEvent: (eventId: string, updates: Partial<EventData>) => void;
    // Case management props
    onAddCase: (eventId: string) => void;
    onRemoveCase: (eventId: string, caseId: string) => void;
    onUpdateCase: (
        eventId: string,
        caseId: string,
        updates: Partial<{ label: string; objects: InventoryObject[] }>
    ) => void;
    onAddObject: (eventId: string, caseId: string) => void;
    onRemoveObject: (
        eventId: string,
        caseId: string,
        objectIndex: number
    ) => void;
    onUpdateObject: (
        eventId: string,
        caseId: string,
        objectIndex: number,
        updates: Partial<{ w: number; h: number; totalCount: number }>
    ) => void;
}

export const EventList: React.FC<EventListProps> = ({
    customEvents,
    selectedEvent,
    onDeleteEvent,
    onExportEvent,
    onExportToClipboard,
    onUpdateEvent,
    onAddCase,
    onRemoveCase,
    onUpdateCase,
    onAddObject,
    onRemoveObject,
    onUpdateObject,
}) => {
    const [selectedCustomEventId, setSelectedCustomEventId] =
        useState<string>('');

    // 커스텀 이벤트가 있을 때 첫 번째 이벤트를 자동 선택
    useEffect(() => {
        if (customEvents.length > 0 && !selectedCustomEventId) {
            setSelectedCustomEventId(customEvents[0].id);
        }
    }, [customEvents, selectedCustomEventId]);

    if (customEvents.length === 0) {
        return (
            <div className="border-border/60 dark:border-border/40 rounded-lg border-2 border-dashed p-8 text-center">
                <p className="text-muted-foreground font-medium">
                    아직 커스텀 이벤트가 없습니다
                </p>
                <p className="text-muted-foreground/80 mt-1 text-sm">
                    위에서 새 이벤트를 만들거나 기존 이벤트를 가져와보세요
                </p>
            </div>
        );
    }

    const handleDeleteEvent = (eventId: string) => {
        const event = customEvents.find((e) => e.id === eventId);
        if (!event) return;

        if (
            window.confirm(
                `정말로 "${event.name}" 이벤트를 삭제하시겠습니까?\n\n모든 케이스와 설정이 함께 삭제됩니다.`
            )
        ) {
            onDeleteEvent(event.id);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="border-border/60 dark:border-border/40 flex w-full items-center justify-between px-4">
                <div className="flex w-full items-center gap-2">
                    <Select
                        value={selectedCustomEventId}
                        onValueChange={setSelectedCustomEventId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="이벤트 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {customEvents.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                    {event.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center justify-between px-4">
                        {selectedCustomEventId &&
                            (() => {
                                const event = customEvents.find(
                                    (e) => e.id === selectedCustomEventId
                                );
                                if (!event) return null;
                                return (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() =>
                                                onExportEvent(event.id)
                                            }
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/40 h-8 w-8 p-0"
                                            title="파일로 내보내기"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                onExportToClipboard(event.id)
                                            }
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/40 h-8 w-8 p-0"
                                            title="클립보드에 복사"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                handleDeleteEvent(event.id)
                                            }
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                            title="이벤트 삭제"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })()}
                    </div>
                </div>
            </div>

            {/* 선택된 이벤트만 표시 */}
            {selectedCustomEventId &&
                (() => {
                    const currentEvent = customEvents.find(
                        (event) => event.id === selectedCustomEventId
                    );
                    if (!currentEvent) return null;

                    return (
                        <EventListItem
                            event={currentEvent}
                            selectedEvent={selectedEvent}
                            onUpdateEvent={onUpdateEvent}
                            onAddCase={onAddCase}
                            onRemoveCase={onRemoveCase}
                            onUpdateCase={onUpdateCase}
                            onAddObject={onAddObject}
                            onRemoveObject={onRemoveObject}
                            onUpdateObject={onUpdateObject}
                        />
                    );
                })()}
        </div>
    );
};
