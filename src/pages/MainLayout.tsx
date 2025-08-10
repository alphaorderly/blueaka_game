import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { CalculatorHeader } from '../components/layout/CalculatorHeader';
import { SettingsModal } from '../components/settings/SettingsModal';
import { useCalculatorState } from '../hooks/useCalculatorState';

const MainLayout: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // 헤더에서 필요한 상태들을 여기서 관리
    const {
        selectedEvent,
        autoSave,
        setAutoSave,
        setSelectedEvent,
        clearGridState,
        resetToDefaults,
        customEvents,
        createCustomEvent,
        updateCustomEvent,
        deleteCustomEvent,
        exportCustomEvent,
        importCustomEvent,
        downloadFile,
        addCaseToCustomEvent,
        removeCaseFromCustomEvent,
        updateCaseInCustomEvent,
        addObjectToCustomEventCase,
        removeObjectFromCustomEventCase,
        updateObjectInCustomEventCase,
    } = useCalculatorState();

    const handleSettingsOpen = () => {
        setIsSettingsOpen(true);
    };

    const handleClearState = () => {
        clearGridState();
        location.reload(); // 페이지 새로고침
    };

    const handleToggleAutoSave = () => {
        setAutoSave(!autoSave);
    };

    const handleResetToDefaults = () => {
        resetToDefaults();
        location.reload(); // 페이지 새로고침
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
                <CalculatorHeader
                    autoSave={autoSave}
                    onSettingsOpen={handleSettingsOpen}
                    onClearState={handleClearState}
                    onToggleAutoSave={handleToggleAutoSave}
                    onResetToDefaults={handleResetToDefaults}
                />

                {/* 페이지 컨텐츠 */}
                <div className="mt-4 sm:mt-6">
                    <Outlet />
                </div>

                {/* 설정 모달 */}
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    customEvents={customEvents}
                    selectedEvent={selectedEvent}
                    createCustomEvent={createCustomEvent}
                    updateCustomEvent={updateCustomEvent}
                    deleteCustomEvent={deleteCustomEvent}
                    setSelectedEvent={setSelectedEvent}
                    exportCustomEvent={exportCustomEvent}
                    importCustomEvent={importCustomEvent}
                    downloadFile={downloadFile}
                    addCaseToCustomEvent={addCaseToCustomEvent}
                    removeCaseFromCustomEvent={removeCaseFromCustomEvent}
                    updateCaseInCustomEvent={updateCaseInCustomEvent}
                    addObjectToCustomEventCase={addObjectToCustomEventCase}
                    removeObjectFromCustomEventCase={
                        removeObjectFromCustomEventCase
                    }
                    updateObjectInCustomEventCase={
                        updateObjectInCustomEventCase
                    }
                />
            </div>
        </div>
    );
};

export default MainLayout;
