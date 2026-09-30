import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = ({
    className,
    ...props
}: React.ComponentProps<'textarea'>) => {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'border-input bg-surface placeholder:text-faint hover:border-faint focus-visible:border-primary focus-visible:ring-primary/20 flex field-sizing-content min-h-24 w-full rounded-md border px-2.5 py-2 text-base transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-[13px]',
                className
            )}
            {...props}
        />
    );
};

export { Textarea };
