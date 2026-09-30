import { Outlet } from 'react-router';
import { AppHeader } from './components/AppHeader';

const AppShell = () => {
    return (
        <div className="flex min-h-svh flex-col">
            <AppHeader />
            <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pt-5 pb-16 sm:px-6 sm:pt-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AppShell;
