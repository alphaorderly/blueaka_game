import { useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { EventData } from '@/types/inventory-management/inventory';
import { cn } from '@/lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Seoul');

const SOURCE_FORMAT = 'YYYY-MM-DD HH:mm';
const DISPLAY_FORMAT = 'M.D HH:mm';

type ScheduleRow = {
    id: string;
    name: string;
    live: boolean;
    status: string;
    range: string;
};

const parse = (value?: string | null) => {
    if (!value) return null;
    const parsed = dayjs.tz(value, SOURCE_FORMAT, 'Asia/Seoul');
    return parsed.isValid() ? parsed : null;
};

export const EventSchedule = ({ events }: { events: EventData[] }) => {
    const rows = useMemo(() => {
        const now = dayjs.tz();

        return events.flatMap((event): ScheduleRow[] => {
            const start = parse(event.startDate);
            const end = parse(event.endDate);
            if (!start && !end) return [];
            if (end && now.isAfter(end)) return [];

            const range = [start, end]
                .map((date) => date?.format(DISPLAY_FORMAT) ?? '')
                .join(' – ');

            if (start && now.isBefore(start)) {
                const days = Math.max(
                    1,
                    Math.ceil(start.diff(now, 'hour') / 24)
                );
                return [
                    {
                        id: event.id,
                        name: event.name,
                        live: false,
                        status: `D-${days}`,
                        range,
                    },
                ];
            }

            const left = end ? Math.ceil(end.diff(now, 'hour') / 24) : null;
            return [
                {
                    id: event.id,
                    name: event.name,
                    live: true,
                    status: left !== null ? `${left}일 남음` : '진행 중',
                    range,
                },
            ];
        });
    }, [events]);

    if (rows.length === 0) return null;

    return (
        <ul className="divide-y">
            {rows.map((row) => (
                <li
                    key={row.id}
                    className="flex gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                    <span
                        aria-hidden
                        className={cn(
                            'mt-[7px] size-1.5 shrink-0 rounded-full',
                            row.live ? 'bg-primary' : 'bg-border-strong'
                        )}
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] leading-5 font-medium">
                            {row.name}
                        </p>
                        <p className="text-muted-foreground tabular text-xs leading-5">
                            {row.range}
                        </p>
                    </div>
                    <span
                        className={cn(
                            'tabular shrink-0 text-xs leading-5 font-medium',
                            row.live ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                        {row.status}
                    </span>
                </li>
            ))}
        </ul>
    );
};
