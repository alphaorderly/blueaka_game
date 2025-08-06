import React, { useState, useEffect } from 'react';
import { Label } from '../../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';
import { EventData, CaseOption } from '../../../types/calculator';
import { EventListItem } from './EventListItem';

interface EventListProps {
    customEvents: EventData[];
    selectedEvent: string;
    onSelectEvent: (eventId: string) => void;
    onDeleteEvent: (eventId: string) => void;
    onExportEvent: (eventId: string) => void;
    onExportToClipboard: (eventId: string) => void;
    onUpdateEvent: (eventId: string, updates: Partial<EventData>) => void;
    onShowMessage: (type: 'success' | 'error', text: string) => void;
    // Case management props
    onAddCase: (eventId: string) => void;
    onRemoveCase: (eventId: string, caseIndex: number) => void;
    onUpdateCase: (
        eventId: string,
        caseIndex: number,
        field: keyof CaseOption,
        value: string
    ) => void;
    onAddObject: (eventId: string, caseIndex: number) => void;
    onRemoveObject: (
        eventId: string,
        caseIndex: number,
        objectIndex: number
    ) => void;
    onUpdateObject: (
        eventId: string,
        caseIndex: number,
        objectIndex: number,
        field: string,
        value: number
    ) => void;
}

export const EventList: React.FC<EventListProps> = ({
    customEvents,
    selectedEvent,
    onSelectEvent,
    onDeleteEvent,
    onExportEvent,
    onExportToClipboard,
    onUpdateEvent,
    onShowMessage,
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
                (e) => e.id !== eventId
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
            <div className="text-muted-foreground py-8 text-center">
                <p>아직 커스텀 이벤트가 없습니다.</p>
                <p className="text-sm">
                    위에서 새 이벤트를 만들거나 기존 이벤트를 가져와보세요.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3">
                <Label className="text-base font-semibold">
                    내 커스텀 이벤트 ({customEvents.length}개)
                </Label>
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">
                        편집할 이벤트:
                    </Label>
                    <Select
                        value={selectedCustomEventId}
                        onValueChange={setSelectedCustomEventId}
                    >
                        <SelectTrigger className="w-[250px]">
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
                        (e) => e.id === selectedCustomEventId
                    );
                    if (!currentEvent) return null;

                    return (
                        <EventListItem
                            event={currentEvent}
                            selectedEvent={selectedEvent}
                            onSelectEvent={onSelectEvent}
                            onDeleteEvent={handleDeleteEvent}
                            onExportEvent={onExportEvent}
                            onExportToClipboard={onExportToClipboard}
                            onUpdateEvent={onUpdateEvent}
                            onShowMessage={onShowMessage}
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
