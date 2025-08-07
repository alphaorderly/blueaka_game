import React, { useState, useEffect } from 'react';
import { SimpleEventSelection } from '../components/forms/SimpleEventSelection';
import { AVAILABLE_EVENTS, getDefaultEvent } from '../consts/events';
import { EventData } from '../types/calculator';
import { GameSimulation } from '@/components/game';

const GameSimulationPage: React.FC = () => {
    const [selectedEvent, setSelectedEvent] =
        useState<EventData>(getDefaultEvent());
    const [selectedCase, setSelectedCase] = useState<string>('case1');

    // 이벤트 변경 시 첫 번째 케이스로 리셋
    useEffect(() => {
        if (selectedEvent.caseOptions.length > 0) {
            setSelectedCase(selectedEvent.caseOptions[0].value);
        }
    }, [selectedEvent]);

    const handleEventChange = (eventId: string) => {
        const event = AVAILABLE_EVENTS.find((e) => e.id === eventId);
        if (event) {
            setSelectedEvent(event);
        }
    };

    return (
        <div>
            <div className="w-full px-2 sm:px-4 md:px-6">
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                    {/* 이벤트 선택 */}
                    <div className="bg-card mx-auto max-w-4xl rounded-xl border p-4 sm:p-6">
                        <SimpleEventSelection
                            selectedEventId={selectedEvent.id}
                            selectedCase={selectedCase}
                            onEventChange={handleEventChange}
                            onCaseChange={setSelectedCase}
                        />
                    </div>

                    {/* 게임 시뮬레이션 */}
                    <div className="bg-card mx-auto max-w-5xl rounded-xl border p-4 sm:p-6">
                        <GameSimulation
                            selectedEvent={selectedEvent}
                            selectedCase={selectedCase}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameSimulationPage;
