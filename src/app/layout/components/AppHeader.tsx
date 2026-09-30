import { Link, NavLink } from 'react-router';
import { Github, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/theme/theme';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '../nav-items';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={isDark ? '라이트 모드' : '다크 모드'}
            title={isDark ? '라이트 모드' : '다크 모드'}
        >
            {isDark ? <Sun /> : <Moon />}
        </Button>
    );
};

const AppHeader = () => {
    return (
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
            <div className="mx-auto flex h-12 w-full max-w-[1180px] items-stretch gap-5 px-4 sm:gap-8 sm:px-6">
                <Link
                    to="/"
                    className="flex shrink-0 items-center gap-2.5"
                    aria-label="홈"
                >
                    <span
                        aria-hidden
                        className="skew-mark bg-primary block h-[15px] w-[9px] rounded-[1px]"
                    />
                    <span className="text-[13px] font-semibold tracking-[-0.01em]">
                        재고 관리
                    </span>
                </Link>

                <nav className="flex items-stretch gap-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    'relative flex items-center px-2 text-[13px] font-medium transition-colors',
                                    'after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-full after:transition-colors',
                                    isActive
                                        ? 'text-foreground after:bg-primary'
                                        : 'text-muted-foreground hover:text-foreground after:bg-transparent'
                                )
                            }
                        >
                            {item.title}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-0.5">
                    <ThemeToggle />
                    <Button asChild variant="ghost" size="icon-sm">
                        <a
                            href="https://github.com/alphaorderly/blueaka_game"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="GitHub"
                            title="GitHub"
                        >
                            <Github />
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    );
};

export { AppHeader };
