import React, { useCallback, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn/cn';

type ContentRenderFn = (helpers: { close: () => void }) => React.ReactNode;
type ContentRenderer = React.ReactNode | ContentRenderFn;

interface DialogShellProps {
    title?: React.ReactNode;
    children?: React.ReactNode;
    content: ContentRenderer;
    footer?: ContentRenderer;
    contentClassName?: string;
    headerClassName?: string;
    bodyClassName?: string;
    footerClassName?: string;
    headerActions?: React.ReactNode;
    showCloseButton?: boolean;
    defaultOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    onOpenChange?: (open: boolean) => void;
}

export const DialogShell: React.FC<DialogShellProps> = ({
    title,
    children,
    content,
    footer,
    contentClassName,
    headerClassName,
    bodyClassName,
    footerClassName,
    headerActions,
    showCloseButton = true,
    defaultOpen = false,
    onOpen,
    onClose,
    onOpenChange,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            setIsOpen(nextOpen);
            onOpenChange?.(nextOpen);
            if (nextOpen) {
                onOpen?.();
            } else {
                onClose?.();
            }
        },
        [onClose, onOpen, onOpenChange]
    );

    const closeDialog = useCallback(() => {
        handleOpenChange(false);
    }, [handleOpenChange]);

    const renderContent = useCallback(
        (value: ContentRenderer): React.ReactNode =>
            typeof value === 'function'
                ? (value as ContentRenderFn)({ close: closeDialog })
                : value,
        [closeDialog]
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children ? (
                <DialogTrigger asChild>{children}</DialogTrigger>
            ) : null}
            <DialogContent
                className={cn(
                    'bg-background/95 flex max-h-[90vh] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden p-0',
                    contentClassName
                )}
                showCloseButton={false}
            >
                {(title || showCloseButton || headerActions) && (
                    <DialogHeader
                        className={cn(
                            'border-border/60 dark:border-border/40 flex flex-row items-center justify-between border-b p-4',
                            headerClassName
                        )}
                    >
                        {title ? (
                            typeof title === 'string' ? (
                                <DialogTitle className="text-foreground text-xl font-semibold">
                                    {title}
                                </DialogTitle>
                            ) : (
                                title
                            )
                        ) : (
                            <span />
                        )}
                        {(showCloseButton || headerActions) && (
                            <div className="flex items-center gap-2">
                                {headerActions}
                                {showCloseButton && (
                                    <DialogClose asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            aria-label="Close dialog"
                                        >
                                            <X className="size-6" />
                                        </Button>
                                    </DialogClose>
                                )}
                            </div>
                        )}
                    </DialogHeader>
                )}

                <div className={cn('flex-1 overflow-y-auto', bodyClassName)}>
                    {renderContent(content)}
                </div>

                {footer ? (
                    <DialogFooter
                        className={cn(
                            'border-border/60 dark:border-border/40 border-t p-4',
                            footerClassName
                        )}
                    >
                        {renderContent(footer)}
                    </DialogFooter>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};
