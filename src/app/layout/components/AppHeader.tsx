import type { ReactNode } from 'react';
import { Github, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/theme';
import { cn } from '@/lib/utils';
import { MobileNav } from './MobileNav';

const HeaderThemeToggle = ({ className }: { className?: string }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(
                'text-muted-foreground hover:text-foreground',
                className
            )}
            aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
    );
};

interface AppHeaderProps {
    actions?: ReactNode;
}

const AppHeader = ({ actions }: AppHeaderProps) => {
    return (
        <header className="pointer-events-none flex justify-center px-4 py-4 pb-0 sm:px-6 lg:px-10">
            <div className="border-border/60 bg-background/90 pointer-events-auto mx-auto flex h-14 w-full max-w-7xl items-center gap-3 rounded-xl border px-4 sm:h-16 sm:px-5">
                <MobileNav />

                <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-primary/80 text-xs font-semibold tracking-[0.28em] uppercase">
                        BlueAka Tools
                    </span>
                    <span className="text-foreground text-sm font-semibold sm:text-base">
                        블루아카이브 종합 도구
                    </span>
                </div>

                <HeaderThemeToggle className="md:hidden" />

                <div className="hidden items-center gap-2 md:flex">
                    {actions}
                    <HeaderThemeToggle />
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <a
                            href="https://github.com/alphaorderly/blueaka_game"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="alphaorderly/blueaka_game GitHub 저장소 열기"
                        >
                            <Github className="size-6" />
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    );
};

export { AppHeader };
