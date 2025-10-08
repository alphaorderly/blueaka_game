import { cn } from '@/lib/utils';

const Separator = ({
    className,
    orientation = 'horizontal',
    decorative = true,
    ...props
}: React.ComponentProps<'div'> & {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
}) => (
    <div
        role={decorative ? 'presentation' : 'separator'}
        data-orientation={orientation}
        className={cn(
            'bg-border shrink-0',
            orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
            className
        )}
        {...props}
    />
);

export { Separator };
