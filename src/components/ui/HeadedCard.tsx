import * as React from 'react';

import { cn } from '@/lib/utils';

type DivProps = React.ComponentProps<'div'>;

const HeadedCardRoot = ({ className, ...props }: DivProps) => {
    return (
        <div
            data-slot="headed-card"
            className={cn(
                'border-border/60 bg-card/95 supports-[backdrop-filter]:bg-card/80 flex flex-col overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm',
                className
            )}
            {...props}
        />
    );
};

const HeadedCardHeader = ({ className, ...props }: DivProps) => {
    return (
        <div
            data-slot="headed-card-header"
            className={cn(
                'border-border/60 bg-accent/20 border-b p-4',
                className
            )}
            {...props}
        />
    );
};

const HeadedCardContent = ({ className, ...props }: DivProps) => {
    return (
        <div
            data-slot="headed-card-content"
            className={cn('p-6', className)}
            {...props}
        />
    );
};

const HeadedCardFooter = ({ className, ...props }: DivProps) => {
    return (
        <div
            data-slot="headed-card-footer"
            className={cn(className)}
            {...props}
        />
    );
};

const HeadedCard = Object.assign(HeadedCardRoot, {
    Header: HeadedCardHeader,
    Content: HeadedCardContent,
    Footer: HeadedCardFooter,
});

export { HeadedCard };
