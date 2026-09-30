import type { ComponentProps, ReactNode } from 'react';
import { GRID_HEIGHT, GRID_WIDTH } from '@/consts/inventory-management/events';
import type { ObjectTypeColor } from '@/utils/inventory/colorUtils';
import { cn } from '@/lib/utils';
import {
    COLUMN_LABELS,
    gridArea,
    objectColorClass,
    objectColorVars,
} from './boardUtils';

interface BoardProps extends Omit<ComponentProps<'div'>, 'children'> {
    children: ReactNode;
}

export const Board = ({ children, className, style, ...props }: BoardProps) => {
    return (
        <div
            className={cn('grid gap-[3px] select-none', className)}
            style={{
                gridTemplateColumns: `0.875rem repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
                gridTemplateRows: `0.875rem repeat(${GRID_HEIGHT}, auto)`,
                ...style,
            }}
            {...props}
        >
            {Array.from({ length: GRID_WIDTH }, (_, x) => (
                <span
                    key={`col-${x}`}
                    aria-hidden
                    className="text-faint self-start text-center text-[10px] leading-none font-medium"
                    style={{ gridColumn: x + 2, gridRow: 1 }}
                >
                    {COLUMN_LABELS[x]}
                </span>
            ))}
            {Array.from({ length: GRID_HEIGHT }, (_, y) => (
                <span
                    key={`row-${y}`}
                    aria-hidden
                    className="text-faint tabular self-center text-left text-[10px] leading-none font-medium"
                    style={{ gridColumn: 1, gridRow: y + 2 }}
                >
                    {y + 1}
                </span>
            ))}
            {children}
        </div>
    );
};

interface ObjectBlockProps {
    x: number;
    y: number;
    width: number;
    height: number;
    color?: ObjectTypeColor;
    label?: ReactNode;
    className?: string;
}

/** A placed/found object drawn as one block spanning its cells. */
export const ObjectBlock = ({
    x,
    y,
    width,
    height,
    color,
    label,
    className,
}: ObjectBlockProps) => {
    return (
        <div
            aria-hidden
            className={cn(
                objectColorClass,
                'pointer-events-none z-10 flex items-start justify-start rounded-[5px] p-1.5 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]',
                className
            )}
            style={{
                ...gridArea(x, y, width, height),
                ...objectColorVars(color),
            }}
        >
            {label !== undefined && (
                <span className="tabular text-[11px] leading-none font-semibold sm:text-xs">
                    {label}
                </span>
            )}
        </div>
    );
};

interface ShapeGlyphProps {
    w: number;
    h: number;
    className?: string;
}

/** Tiny w×h dot matrix used to identify an object by its footprint. */
export const ShapeGlyph = ({ w, h, className }: ShapeGlyphProps) => {
    return (
        <span
            aria-hidden
            className={cn('grid shrink-0 gap-[2px]', className)}
            style={{ gridTemplateColumns: `repeat(${w}, 5px)` }}
        >
            {Array.from({ length: w * h }, (_, i) => (
                <span key={i} className="size-[5px] rounded-[1px] bg-current" />
            ))}
        </span>
    );
};
