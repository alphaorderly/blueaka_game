import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface EventPickerProps {
    events: { id: string; name: string }[];
    cases: { value: string; label: string }[];
    selectedEvent: string;
    selectedCase: string;
    onEventChange: (eventId: string) => void;
    onCaseChange: (caseId: string) => void;
}

export const EventPicker = ({
    events,
    cases,
    selectedEvent,
    selectedCase,
    onEventChange,
    onCaseChange,
}: EventPickerProps) => {
    return (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem] lg:grid-cols-1">
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="event-select">이벤트</Label>
                <Select value={selectedEvent} onValueChange={onEventChange}>
                    <SelectTrigger id="event-select" className="w-full">
                        <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                                {event.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="case-select">회차</Label>
                <Select
                    value={selectedCase}
                    onValueChange={onCaseChange}
                    disabled={cases.length === 0}
                >
                    <SelectTrigger id="case-select" className="w-full">
                        <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {cases.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
