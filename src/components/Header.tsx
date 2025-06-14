import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '@/hooks/useTheme';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="app-header sticky top-0 z-10 w-full border-b">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:py-3">
                <h1 className="text-lg font-semibold sm:text-2xl">
                    Blueaka Calculator
                </h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="size-5" />
                    ) : (
                        <Moon className="size-5" />
                    )}
                </Button>
            </div>
        </header>
    );
};

export default Header;
