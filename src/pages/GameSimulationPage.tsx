import React, { useState, useEffect } from 'react';
import { CalculatorHeader } from '../components/layout/CalculatorHeader';
import { SimpleEventSelection } from '../components/forms/SimpleEventSelection';
import { AVAILABLE_EVENTS, getDefaultEvent } from '../consts/events';
import { EventData } from '../types/calculator';
import { GameSimulation } from '@/components/game';

const GameSimulationPage: React.FC = () => {
    const [selectedEvent, setSelectedEvent] =
        useState<EventData>(getDefaultEvent());
    const [selectedCase, setSelectedCase] = useState<string>('case1');
    const [autoSave] = useState(true); // 게임 페이지에서는 자동저장 기본 활성화

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

    // 헤더 버튼들 (게임 페이지에서는 비활성화 또는 다른 동작)
    const handleClearState = () => {
        // 게임 상태 초기화 로직
        console.log('게임 상태 초기화');
    };

    const handleToggleAutoSave = () => {
        // 자동저장 토글 (게임 페이지에서는 별도 처리)
        console.log('자동저장 토글');
    };

    const handleResetToDefaults = () => {
        // 기본값으로 리셋
        setSelectedEvent(getDefaultEvent());
        setSelectedCase('case1');
    };

    const handleSettingsOpen = () => {
        // 설정 모달은 게임 페이지에서 제거
        console.log('설정 기능은 계산기 페이지에서 사용 가능합니다.');
    };

    return (
        <div className="bg-background min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <CalculatorHeader
                    autoSave={autoSave}
                    onSettingsOpen={handleSettingsOpen}
                    onClearState={handleClearState}
                    onToggleAutoSave={handleToggleAutoSave}
                    onResetToDefaults={handleResetToDefaults}
                />

                <div className="mt-8 space-y-8">
                    {/* 이벤트 선택 */}
                    <div className="bg-card rounded-xl border p-6">
                        <SimpleEventSelection
                            selectedEventId={selectedEvent.id}
                            selectedCase={selectedCase}
                            onEventChange={handleEventChange}
                            onCaseChange={setSelectedCase}
                        />
                    </div>

                    {/* 게임 시뮬레이션 */}
                    <div className="bg-card rounded-xl border p-6">
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
