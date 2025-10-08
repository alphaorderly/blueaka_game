import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NavSection } from '../nav-items';

interface AppSidebarProps {
    sections: NavSection[];
    currentPath: string;
}

const AppSidebar = ({ sections, currentPath }: AppSidebarProps) => {
    return (
        <aside className="hidden w-64 flex-none lg:flex">
            <div className="border-border/60 bg-card/80 flex h-full w-full flex-col rounded-2xl border p-4 shadow-sm backdrop-blur">
                <nav className="flex flex-1 flex-col gap-6">
                    {sections.map((section) => (
                        <div
                            key={section.title}
                            className="group border-border/60 bg-muted/40 relative space-y-2 rounded-xl border p-3 transition-colors"
                        >
                            <p className="text-muted-foreground/80 mb-2 text-xs font-semibold tracking-[0.18em] uppercase">
                                {section.title}
                            </p>
                            <div className="space-y-1.5 pl-1">
                                {section.items.map((item) => {
                                    const isActive = currentPath === item.href;
                                    return (
                                        <Button
                                            key={item.title}
                                            asChild
                                            variant={
                                                isActive ? 'secondary' : 'ghost'
                                            }
                                            className={cn(
                                                'group hover:bg-muted/60 focus-visible:ring-ring relative flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                                item.disabled &&
                                                    'pointer-events-none opacity-60',
                                                isActive &&
                                                    'border-primary/30 bg-primary/10 text-primary border shadow-sm'
                                            )}
                                        >
                                            <Link
                                                to={item.href}
                                                className="flex w-full items-center gap-2.5"
                                            >
                                                <item.icon className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
                                                <span className="text-foreground text-sm font-medium">
                                                    {item.title}
                                                </span>
                                                {item.badge && (
                                                    <Badge
                                                        variant={
                                                            isActive
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className="border-border/70 bg-background/60 border text-xs uppercase"
                                                    >
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="mt-auto" />
            </div>
        </aside>
    );
};

export { AppSidebar };
