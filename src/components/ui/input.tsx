import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = ({
    className,
    type,
    ...props
}: React.ComponentProps<'input'>) => {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                'border-input bg-surface placeholder:text-faint flex h-9 w-full min-w-0 rounded-md border px-2.5 text-base transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[13px]',
                'hover:border-faint focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2',
                'aria-invalid:border-destructive',
                '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                className
            )}
            {...props}
        />
    );
};

export { Input };
