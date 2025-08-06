import React from 'react';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { GameObject } from '../../types/calculator';

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
    currentObjects: GameObject[];
    onEventChange: (eventId: string) => void;
    onCaseChange: (caseId: string) => void;
}

export const EventSelection: React.FC<EventSelectionProps> = ({
    selectedEvent,
    selectedCase,
    availableEvents,
    caseOptions,
    currentObjects,
    onEventChange,
    onCaseChange,
}) => {
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
                    <Select value={selectedEvent} onValueChange={onEventChange}>
                        <SelectTrigger className="border-border/50 bg-background/50 hover:bg-background/80 h-11 w-full transition-colors">
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
                        <SelectTrigger className="border-border/50 bg-background/50 hover:bg-background/80 h-11 w-full transition-colors">
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

            {currentObjects.length > 0 && (
                <div className="border-border/40 bg-muted/30 rounded-lg border p-4">
                    <div className="mb-3">
                        <div className="text-foreground text-sm font-medium">
                            현재 선택된 설정
                        </div>
                        <div className="text-muted-foreground text-xs">
                            {availableEvents.find((e) => e.id === selectedEvent)
                                ?.name || '알 수 없는 이벤트'}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-muted-foreground text-xs font-medium">
                            오브젝트 목록:
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {currentObjects.map((obj, index) => (
                                <div
                                    key={index}
                                    className="bg-background/50 flex items-center gap-2 rounded-md px-3 py-2 text-xs"
                                >
                                    <div className="bg-primary/20 text-primary flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                                        {index + 1}
                                    </div>
                                    <span className="text-foreground">
                                        {obj.w}×{obj.h} 크기
                                    </span>
                                    <span className="text-muted-foreground ml-auto">
                                        {obj.totalCount}개
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
