import { useEffect, useState } from 'react';
import { SimpleEventSelection } from '@/components/inventory/forms/SimpleEventSelection';
import {
    AVAILABLE_EVENTS,
    getDefaultEvent,
} from '@/consts/inventory-management/events';
import type { EventData } from '@/types/inventory-management/inventory';
import { Card, CardContent } from '@/components/ui/card';
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
        <div className="space-y-6">
            <Card className="border-border/60 bg-card/95 supports-[backdrop-filter]:bg-card/80 border shadow-sm backdrop-blur-sm">
                <CardContent className="space-y-6">
                    <SimpleEventSelection
                        selectedEventId={selectedEvent.id}
                        selectedCase={selectedCase}
                        onEventChange={handleEventChange}
                        onCaseChange={setSelectedCase}
                    />
                </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/95 supports-[backdrop-filter]:bg-card/80 border shadow-sm backdrop-blur-sm">
                <CardContent className="space-y-6">
                    <InventorySimulation
                        selectedEvent={selectedEvent}
                        selectedCase={selectedCase}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default SimulationDashboard;
