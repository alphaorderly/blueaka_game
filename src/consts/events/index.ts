import { EventData } from '../../types/calculator';
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

export const DEFAULT_EVENT_ID = 'shale-final-report';

export const getEventById = (eventId: string): EventData | undefined => {
    return AVAILABLE_EVENTS.find((event) => event.id === eventId);
};

export const getDefaultEvent = (): EventData => {
    return getEventById(DEFAULT_EVENT_ID) || AVAILABLE_EVENTS[0];
};
