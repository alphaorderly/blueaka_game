import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/85',
                destructive:
                    'bg-destructive text-white hover:bg-destructive/90',
                outline:
                    'border border-border-strong bg-surface text-foreground hover:bg-accent',
                secondary: 'bg-sunken text-foreground hover:bg-accent',
                ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
                'ghost-danger':
                    'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-3.5',
                sm: 'h-8 px-2.5',
                xs: 'h-7 gap-1 rounded-sm px-2 text-xs',
                lg: 'h-10 px-5 text-sm',
                icon: 'size-9',
                'icon-sm': 'size-8',
                'icon-xs': 'size-7 rounded-sm',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const Button = ({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) => {
    const Comp = asChild ? Slot : 'button';

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
