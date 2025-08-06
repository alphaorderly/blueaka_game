import React from 'react';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { AVAILABLE_EVENTS } from '../../consts/events';

interface SimpleEventSelectionProps {
    selectedEventId: string;
    selectedCase: string;
    onEventChange: (eventId: string) => void;
    onCaseChange: (caseId: string) => void;
}

export const SimpleEventSelection: React.FC<SimpleEventSelectionProps> = ({
    selectedEventId,
    selectedCase,
    onEventChange,
    onCaseChange,
}) => {
    const selectedEvent = AVAILABLE_EVENTS.find(
        (e) => e.id === selectedEventId
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                    <Label
                        htmlFor="event-select"
                        className="text-foreground text-sm font-medium"
                    >
                        이벤트 선택
                    </Label>
                    <Select
                        value={selectedEventId}
                        onValueChange={onEventChange}
                    >
                        <SelectTrigger id="event-select">
                            <SelectValue placeholder="이벤트를 선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {AVAILABLE_EVENTS.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                    {event.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedEvent && (
                    <div className="space-y-3">
                        <Label
                            htmlFor="case-select"
                            className="text-foreground text-sm font-medium"
                        >
                            회차 선택
                        </Label>
                        <Select
                            value={selectedCase}
                            onValueChange={onCaseChange}
                        >
                            <SelectTrigger id="case-select">
                                <SelectValue placeholder="회차를 선택해주세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedEvent.caseOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {selectedEvent && (
                <div className="space-y-3">
                    <h3 className="text-foreground text-sm font-medium">
                        이벤트 정보
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="text-foreground font-medium">
                            {selectedEvent.name}
                        </h4>
                        {selectedEvent.description && (
                            <p className="text-muted-foreground mt-1 text-sm">
                                {selectedEvent.description}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
