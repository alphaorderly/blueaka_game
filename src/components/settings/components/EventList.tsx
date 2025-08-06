import React, { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';
import { EventData, GameObject } from '../../../types/calculator';
import { EventListItem } from './EventListItem';

interface EventListProps {
    customEvents: EventData[];
    selectedEvent: string;
    onSelectEvent: (eventId: string) => void;
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
        updates: Partial<{ label: string; objects: GameObject[] }>
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
    onSelectEvent,
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
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <p className="font-medium text-gray-500">
                    아직 커스텀 이벤트가 없습니다
                </p>
                <p className="mt-1 text-sm text-gray-400">
                    위에서 새 이벤트를 만들거나 기존 이벤트를 가져와보세요
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    커스텀 이벤트 관리
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        편집할 이벤트:
                    </span>
                    <Select
                        value={selectedCustomEventId}
                        onValueChange={setSelectedCustomEventId}
                    >
                        <SelectTrigger className="w-[200px] border-gray-300 focus:border-gray-500 focus:ring-gray-500">
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
