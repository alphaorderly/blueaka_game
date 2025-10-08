import { EventData } from '@/types/inventory-management/inventory';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

export const GRID_WIDTH = 9;
export const GRID_HEIGHT = 5;

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

export const getEventById = (eventId: string): EventData | undefined => {
    return AVAILABLE_EVENTS.find((event) => event.id === eventId);
};

const getEventStartDate = (event: EventData) => {
    if (!event.startDate) {
        return null;
    }

    const parsed = dayjs.tz(event.startDate, 'YYYY-MM-DD HH:mm', 'Asia/Seoul');

    return parsed.isValid() ? parsed : null;
};

const getLatestStartedEventId = (): string | undefined => {
    const now = dayjs.tz();
    const candidates = AVAILABLE_EVENTS.filter((event) => {
        const start = getEventStartDate(event);
        return start !== null && !start.isAfter(now);
    }).sort((a, b) => {
        const startA = getEventStartDate(a);
        const startB = getEventStartDate(b);

        if (!startA || !startB) {
            return 0;
        }

        return startA.valueOf() - startB.valueOf();
    });

    const last = candidates[candidates.length - 1];
    return last?.id;
};

export const getDefaultEvent = (): EventData => {
    const candidateId = getLatestStartedEventId() ?? DEFAULT_EVENT_ID;
    return getEventById(candidateId) || AVAILABLE_EVENTS[0];
};
