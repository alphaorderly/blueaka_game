import React from 'react';
import { cn } from '@/lib/utils';

interface MessageDisplayProps {
    message: {
        type: 'success' | 'error';
        text: string;
    } | null;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div
            className={cn(
                'rounded-lg border p-3 text-sm font-medium transition-colors',
                message.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : 'border-destructive/40 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/15 dark:text-destructive-foreground'
            )}
        >
            {message.text}
        </div>
    );
};
