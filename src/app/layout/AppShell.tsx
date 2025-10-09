import { Outlet, useLocation } from 'react-router';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { NAV_SECTIONS } from './nav-items';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const AppShell = () => {
    const location = useLocation();

    return (
        <SidebarProvider className="bg-background relative min-h-svh">
            <AppSidebar
                sections={NAV_SECTIONS}
                currentPath={location.pathname}
            />

            <SidebarInset className="flex min-h-svh flex-col">
                <AppHeader />

                <div className="flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-10">
                    <div className="border-border/60 bg-card/70 mx-auto min-h-[calc(100vh-11rem)] w-full max-w-5xl rounded-2xl border p-6 shadow-sm backdrop-blur">
                        <Outlet />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AppShell;
