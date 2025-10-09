import React from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { InventoryObject } from '@/types/inventory-management/inventory';

interface Event {
    id: string;
    name: string;
}

interface CaseOption {
    value: string;
    label: string;
}

interface EventSelectionProps {
    selectedEvent: string;
    selectedCase: string;
    availableEvents: Event[];
    caseOptions: CaseOption[];
    currentObjects: InventoryObject[];
    onEventChange: (eventId: string) => void;
    onCaseChange: (caseId: string) => void;
}

export const EventSelection: React.FC<EventSelectionProps> = ({
    selectedEvent,
    selectedCase,
    availableEvents,
    caseOptions,
    onEventChange,
    onCaseChange,
}) => {
    return (
        <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                    <Label
                        htmlFor="event-select"
                        className="text-foreground text-sm font-medium"
                    >
                        이벤트 선택
                    </Label>
                    <Select value={selectedEvent} onValueChange={onEventChange}>
                        <SelectTrigger className="border-border/60 bg-background/80 hover:bg-background h-11 w-full border transition-colors">
                            <SelectValue placeholder="이벤트를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableEvents.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                    {event.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <Label
                        htmlFor="case-select"
                        className="text-foreground text-sm font-medium"
                    >
                        회차 선택
                    </Label>
                    <Select value={selectedCase} onValueChange={onCaseChange}>
                        <SelectTrigger className="border-border/60 bg-background/80 hover:bg-background h-11 w-full border transition-colors">
                            <SelectValue placeholder="회차를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {caseOptions.map((option) => (
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
            </div>
        </div>
    );
};
