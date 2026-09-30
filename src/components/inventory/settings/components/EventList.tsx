import React from 'react';
import type { EventData } from '@/types/inventory-management/inventory';
import { cn } from '@/lib/utils';

interface EventListProps {
    customEvents: EventData[];
    activeId: string;
    selectedEvent: string;
    onSelect: (eventId: string) => void;
}

export const EventList: React.FC<EventListProps> = ({
    customEvents,
    activeId,
    selectedEvent,
    onSelect,
}) => {
    if (customEvents.length === 0) {
        return (
            <p className="text-faint px-2 py-6 text-center text-xs">
                이벤트 없음
            </p>
        );
    }

    return (
        <ul className="grid gap-px">
            {customEvents.map((event) => {
                const isActive = event.id === activeId;
                return (
                    <li key={event.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(event.id)}
                            aria-current={isActive}
                            className={cn(
                                'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
                                isActive
                                    ? 'bg-surface font-medium shadow-[0_0_0_1px_var(--border)]'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                        >
                            <span className="min-w-0 flex-1 truncate">
                                {event.name}
                            </span>
                            {event.id === selectedEvent && (
                                <span
                                    className="bg-primary size-1.5 shrink-0 rounded-full"
                                    title="사용 중"
                                />
                            )}
                            <span className="text-faint tabular shrink-0 text-[11px]">
                                {event.caseOptions.length}
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};
