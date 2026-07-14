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
                    <div className="mx-auto min-h-[calc(100vh-11rem)] w-full max-w-7xl rounded-2xl backdrop-blur">
                        <Outlet />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AppShell;
