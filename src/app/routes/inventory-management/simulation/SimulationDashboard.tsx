import { useEffect, useState } from 'react';
import {
    AVAILABLE_EVENTS,
    getDefaultEvent,
} from '@/consts/inventory-management/events';
import type { EventData } from '@/types/inventory-management/inventory';
import { Panel, PanelBody } from '@/components/ui/panel';
import { EventPicker } from '@/components/inventory/forms/EventPicker';
import { InventorySimulation } from '@/components/inventory';

const SimulationDashboard = () => {
    const [selectedEvent, setSelectedEvent] =
        useState<EventData>(getDefaultEvent());
    const [selectedCase, setSelectedCase] = useState<string>('case1');

    useEffect(() => {
        if (selectedEvent.caseOptions.length > 0) {
            setSelectedCase(selectedEvent.caseOptions[0].value);
        }
    }, [selectedEvent]);

    const handleEventChange = (eventId: string) => {
        const nextEvent = AVAILABLE_EVENTS.find(
            (event) => event.id === eventId
        );
        if (nextEvent) {
            setSelectedEvent(nextEvent);
        }
    };

    return (
        <div className="grid items-start gap-4 lg:grid-cols-[296px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-5">
            <Panel className="lg:col-start-1 lg:row-start-1">
                <PanelBody>
                    <EventPicker
                        events={AVAILABLE_EVENTS}
                        cases={selectedEvent.caseOptions}
                        selectedEvent={selectedEvent.id}
                        selectedCase={selectedCase}
                        onEventChange={handleEventChange}
                        onCaseChange={setSelectedCase}
                    />
                </PanelBody>
            </Panel>
            <InventorySimulation
                selectedEvent={selectedEvent}
                selectedCase={selectedCase}
            />
        </div>
    );
};

export default SimulationDashboard;
