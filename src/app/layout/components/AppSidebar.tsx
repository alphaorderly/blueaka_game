import { Link } from 'react-router';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavSection } from '../nav-items';

interface AppSidebarProps {
    sections: NavSection[];
    currentPath: string;
}

const AppSidebar = ({ sections, currentPath }: AppSidebarProps) => {
    return (
        <Sidebar
            collapsible="icon"
            className="border-border/60 bg-card/80 group-data-[variant=sidebar]:border-r"
        >
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl text-base font-semibold">
                        BA
                    </div>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground/80 text-xs font-semibold tracking-[0.28em] uppercase">
                            BlueAka Tools
                        </span>
                        <span className="text-foreground text-sm font-semibold">
                            블루아카이브 종합 도구
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {sections.map((section) => (
                    <SidebarGroup key={section.title}>
                        <SidebarGroupLabel className="text-muted-foreground/80 text-xs tracking-[0.18em]">
                            {section.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {section.items.map((item) => {
                                    const isActive = currentPath === item.href;

                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            {item.disabled ? (
                                                <SidebarMenuButton
                                                    isActive={isActive}
                                                    disabled
                                                    aria-disabled="true"
                                                    tooltip={item.title}
                                                >
                                                    <NavButtonContent
                                                        icon={item.icon}
                                                        title={item.title}
                                                    />
                                                </SidebarMenuButton>
                                            ) : (
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    tooltip={item.title}
                                                >
                                                    <Link
                                                        to={item.href}
                                                        className="flex w-full items-center gap-2"
                                                    >
                                                        <NavButtonContent
                                                            icon={item.icon}
                                                            title={item.title}
                                                        />
                                                    </Link>
                                                </SidebarMenuButton>
                                            )}
                                            {item.badge && (
                                                <SidebarMenuBadge>
                                                    {item.badge}
                                                </SidebarMenuBadge>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    );
};

interface NavButtonContentProps {
    icon: NavSection['items'][number]['icon'];
    title: string;
}

const NavButtonContent = ({ icon: Icon, title }: NavButtonContentProps) => {
    return (
        <span className="flex w-full items-center gap-2">
            <Icon className="text-muted-foreground size-4" />
            <span className="text-sm font-medium">{title}</span>
        </span>
    );
};

export { AppSidebar };
