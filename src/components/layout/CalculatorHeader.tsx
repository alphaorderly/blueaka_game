import React from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '../ui/button';
import { BarChart3, Trash2, RotateCcw, Settings, Gamepad2 } from 'lucide-react';

interface CalculatorHeaderProps {
    autoSave: boolean;
    onSettingsOpen: () => void;
    onClearState: () => void;
    onToggleAutoSave: () => void;
    onResetToDefaults: () => void;
}

export const CalculatorHeader: React.FC<CalculatorHeaderProps> = ({
    autoSave,
    onSettingsOpen,
    onClearState,
    onToggleAutoSave,
    onResetToDefaults,
}) => {
    const location = useLocation();
    const isCalculatorPage = location.pathname === '/';

    return (
        <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                        <h1 className="text-foreground text-lg font-semibold">
                            블루 아카이브 도구
                        </h1>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    <Link to="/">
                        <Button
                            variant={isCalculatorPage ? 'default' : 'ghost'}
                            size="sm"
                            className="h-9 gap-2 text-xs"
                        >
                            <BarChart3 className="h-3 w-3" />
                            확률 계산기
                        </Button>
                    </Link>
                    <Link to="/simulation">
                        <Button
                            variant={!isCalculatorPage ? 'default' : 'ghost'}
                            size="sm"
                            className="h-9 gap-2 text-xs"
                        >
                            <Gamepad2 className="h-3 w-3" />
                            게임 시뮬레이션
                        </Button>
                    </Link>
                </nav>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    onClick={onToggleAutoSave}
                    size="sm"
                    className="hidden h-9 gap-2 text-xs sm:flex"
                >
                    <span
                        className={`h-2 w-2 rounded-full ${autoSave ? 'bg-green-500' : 'bg-gray-400'}`}
                    ></span>
                    자동저장 {autoSave ? 'ON' : 'OFF'}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onClearState}
                    size="sm"
                    className="hidden h-9 gap-1 text-xs sm:flex"
                >
                    <Trash2 className="h-3 w-3" />
                    초기화
                </Button>
                <Button
                    variant="ghost"
                    onClick={onResetToDefaults}
                    size="sm"
                    className="hidden h-9 gap-1 text-xs sm:flex"
                >
                    <RotateCcw className="h-3 w-3" />
                    리셋
                </Button>
                <Button
                    variant="outline"
                    onClick={onSettingsOpen}
                    size="sm"
                    className="h-9 gap-1 text-xs"
                >
                    <Settings className="h-3 w-3" />
                    <span className="hidden sm:inline">설정</span>
                </Button>
            </div>
        </div>
    );
};
