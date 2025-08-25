import { EventData } from '../../types/calculator';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Configure Day.js to use KST
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Seoul');
import { secretMidnightPartyEvent } from './secretMidnightParty';
import { shaleFinalReportEvent } from './shaleFinalReport';
import { hyakayoriSwimsuitEvent } from './HyakayoriSwimsuit';
import { gentleTheOutsideStrongTheInsideEvent } from './gentleTheOutsideStrongTheInside';

export const AVAILABLE_EVENTS: EventData[] = [
    secretMidnightPartyEvent,
    shaleFinalReportEvent,
    hyakayoriSwimsuitEvent,
    gentleTheOutsideStrongTheInsideEvent,
];

export const DEFAULT_EVENT_ID = shaleFinalReportEvent.id;

type EventStarts = {
    id: string;
    start: string; // KST-based datetime string, e.g., "YYYY-MM-DD HH:mm"
};

const eventsStartAt: EventStarts[] = [
    { id: hyakayoriSwimsuitEvent.id, start: '2025-11-25 00:00' },
];

export const getEventById = (eventId: string): EventData | undefined => {
    return AVAILABLE_EVENTS.find((event) => event.id === eventId);
};

const getLatestStartedEventId = (): string | undefined => {
    const now = dayjs.tz();
    const candidates = eventsStartAt
        .map((e) => ({
            id: e.id,
            start: dayjs.tz(e.start, 'YYYY-MM-DD HH:mm', 'Asia/Seoul'),
        }))
        .filter((e) => e.start.isValid() && !e.start.isAfter(now))
        .sort((a, b) => a.start.valueOf() - b.start.valueOf());

    const last = candidates[candidates.length - 1];
    return last?.id;
};

export const getDefaultEvent = (): EventData => {
    const candidateId = getLatestStartedEventId() ?? DEFAULT_EVENT_ID;
    return getEventById(candidateId) || AVAILABLE_EVENTS[0];
};
