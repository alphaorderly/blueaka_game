import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const Panel = ({ className, ...props }: ComponentProps<'section'>) => (
    <section
        className={cn('bg-surface rounded-xl border', className)}
        {...props}
    />
);

interface PanelHeaderProps extends Omit<ComponentProps<'header'>, 'title'> {
    title: ReactNode;
    aside?: ReactNode;
}

const PanelHeader = ({
    title,
    aside,
    className,
    ...props
}: PanelHeaderProps) => (
    <header
        className={cn(
            'flex min-h-11 items-center justify-between gap-3 border-b px-4',
            className
        )}
        {...props}
    >
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {aside && <div className="flex items-center gap-1">{aside}</div>}
    </header>
);

const PanelBody = ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('p-4', className)} {...props} />
);

export { Panel, PanelHeader, PanelBody };
