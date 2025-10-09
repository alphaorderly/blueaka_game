import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface MobileNavProps {
    className?: string;
}

const MobileNav = ({ className }: MobileNavProps) => {
    return (
        <SidebarTrigger
            className={cn(
                'text-muted-foreground hover:text-foreground lg:hidden',
                className
            )}
            aria-label="사이드바 열기"
        />
    );
};

export { MobileNav };
