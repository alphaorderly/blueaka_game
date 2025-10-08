import { Link } from 'react-router';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NavSection } from '../nav-items';

interface MobileNavProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sections: NavSection[];
    currentPath: string;
}

const MobileNav = ({
    open,
    onOpenChange,
    sections,
    currentPath,
}: MobileNavProps) => {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/80 w-full max-w-[18rem] border-r px-0 py-0 shadow-lg backdrop-blur"
            >
                <div className="flex h-full flex-col gap-6 p-4">
                    <nav className="flex-1 space-y-6 overflow-y-auto">
                        {sections.map((section) => (
                            <div
                                key={section.title}
                                className="group hover:border-border/60 hover:bg-muted/40 relative space-y-2 rounded-xl border border-transparent p-3 transition-colors"
                            >
                                <p className="text-muted-foreground/80 text-xs font-semibold tracking-[0.18em] uppercase">
                                    {section.title}
                                </p>
                                <div className="flex flex-col gap-1.5 pl-1">
                                    {section.items.map((item) => {
                                        const isActive =
                                            currentPath === item.href;
                                        return (
                                            <Button
                                                key={item.title}
                                                asChild
                                                variant={
                                                    isActive
                                                        ? 'secondary'
                                                        : 'ghost'
                                                }
                                                className={cn(
                                                    'group hover:bg-muted/60 focus-visible:ring-ring focus-visible:ring-offset-background relative flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                                    item.disabled &&
                                                        'pointer-events-none opacity-60',
                                                    isActive &&
                                                        'border-primary/30 bg-primary/10 text-primary border shadow-sm'
                                                )}
                                                onClick={() => {
                                                    if (!item.disabled) {
                                                        onOpenChange(false);
                                                    }
                                                }}
                                            >
                                                <Link
                                                    to={item.href}
                                                    className="flex w-full items-center justify-between gap-2.5"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <item.icon className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
                                                        <span className="text-foreground text-sm font-medium">
                                                            {item.title}
                                                        </span>
                                                    </div>
                                                    {item.badge && (
                                                        <Badge
                                                            variant={
                                                                isActive
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="border-border/70 bg-background/70 border text-xs uppercase"
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
                </div>
            </SheetContent>
        </Sheet>
    );
};

export { MobileNav };
