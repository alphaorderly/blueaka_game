import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'blueaka-theme';

const applyThemeClass = (theme: Theme) => {
    if (typeof document === 'undefined') {
        return;
    }

    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
};

const getPreferredTheme = (): Theme => {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }

    if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
        return 'dark';
    }

    return 'light';
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const preferred = getPreferredTheme();
        applyThemeClass(preferred);
        return preferred;
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        applyThemeClass(theme);
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const setTheme = useCallback((nextTheme: Theme) => {
        setThemeState(nextTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme,
        }),
        [theme, setTheme, toggleTheme]
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            'useTheme는 ThemeProvider 내부에서만 사용할 수 있습니다.'
        );
    }

    return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export { ThemeProvider, useTheme };
export type { Theme };
