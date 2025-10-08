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

    const handleDeleteEvent = (eventId: string) => {
        onDeleteEvent(eventId);

        // 삭제된 이벤트가 현재 선택된 이벤트라면 다른 이벤트 선택
        if (selectedCustomEventId === eventId) {
            const remainingEvents = customEvents.filter(
                (event) => event.id !== eventId
            );
            if (remainingEvents.length > 0) {
                setSelectedCustomEventId(remainingEvents[0].id);
            } else {
                setSelectedCustomEventId('');
            }
        }
    };

    if (customEvents.length === 0) {
        return (
            <div className="border-border/60 bg-muted/20 dark:border-border/40 rounded-lg border-2 border-dashed p-8 text-center">
                <p className="text-muted-foreground font-medium">
                    아직 커스텀 이벤트가 없습니다
                </p>
                <p className="text-muted-foreground/80 mt-1 text-sm">
                    위에서 새 이벤트를 만들거나 기존 이벤트를 가져와보세요
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="border-border/60 dark:border-border/40 flex items-center justify-between border-b pb-3">
                <h2 className="text-foreground text-lg font-semibold">
                    커스텀 이벤트 관리
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                        편집할 이벤트:
                    </span>
                    <Select
                        value={selectedCustomEventId}
                        onValueChange={setSelectedCustomEventId}
                    >
                        <SelectTrigger className="w-[200px]">
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
                            onDeleteEvent={handleDeleteEvent}
                            onExportToFile={onExportEvent}
                            onExportToClipboard={onExportToClipboard}
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
