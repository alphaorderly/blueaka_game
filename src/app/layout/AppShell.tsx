import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { MobileNav } from './components/MobileNav';
import { NAV_SECTIONS } from './nav-items';

const AppShell = () => {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <MobileNav
                open={isMobileNavOpen}
                onOpenChange={setIsMobileNavOpen}
                sections={NAV_SECTIONS}
                currentPath={location.pathname}
            />

            <AppHeader onOpenMobileNav={() => setIsMobileNavOpen(true)} />

            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8 lg:py-8">
                <AppSidebar
                    sections={NAV_SECTIONS}
                    currentPath={location.pathname}
                />

                <main className="flex-1">
                    <div className="min-h-[calc(100vh-12rem)] rounded-2xl border-none">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppShell;
