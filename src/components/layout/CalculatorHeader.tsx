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
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-2 md:flex-nowrap">
            <div className="flex flex-shrink-0 items-center gap-3 md:gap-6">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                        <h1 className="text-foreground text-base font-semibold md:text-lg">
                            블아 확률 계산기
                        </h1>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    <Link to="/">
                        <Button
                            variant={isCalculatorPage ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 gap-1 px-2 text-xs md:h-9 md:gap-2 md:px-3"
                        >
                            <BarChart3 className="h-3 w-3" />
                            <span className="hidden sm:inline">
                                확률 계산기
                            </span>
                            <span className="sm:hidden">계산기</span>
                        </Button>
                    </Link>
                    <Link to="/simulation">
                        <Button
                            variant={!isCalculatorPage ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 gap-1 px-2 text-xs md:h-9 md:gap-2 md:px-3"
                        >
                            <Gamepad2 className="h-3 w-3" />
                            <span className="hidden sm:inline">
                                게임 시뮬레이션
                            </span>
                            <span className="sm:hidden">시뮬레이션</span>
                        </Button>
                    </Link>
                </nav>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
                <Button
                    variant="ghost"
                    onClick={onToggleAutoSave}
                    size="sm"
                    className="hidden h-8 gap-1 px-2 text-xs md:flex md:h-9 md:gap-2 md:px-3"
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
                    className="hidden h-8 gap-1 px-2 text-xs md:h-9 md:px-3 lg:flex"
                >
                    <Trash2 className="h-3 w-3" />
                    초기화
                </Button>
                <Button
                    variant="ghost"
                    onClick={onResetToDefaults}
                    size="sm"
                    className="hidden h-8 gap-1 px-2 text-xs md:h-9 md:px-3 lg:flex"
                >
                    <RotateCcw className="h-3 w-3" />
                    리셋
                </Button>
                <Button
                    variant="outline"
                    onClick={onSettingsOpen}
                    size="sm"
                    className="h-8 gap-1 px-2 text-xs md:h-9 md:px-3"
                >
                    <Settings className="h-3 w-3" />
                    <span className="hidden md:inline">설정</span>
                </Button>
            </div>
        </div>
    );
};
