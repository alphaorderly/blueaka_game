import type { CSSProperties } from 'react';
import type { ObjectTypeColor } from '@/utils/inventory/colorUtils';

export const COLUMN_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const cellName = (x: number, y: number) =>
    `${COLUMN_LABELS[x] ?? x + 1}${y + 1}`;

export const gridArea = (
    x: number,
    y: number,
    width = 1,
    height = 1
): CSSProperties => ({
    gridColumn: `${x + 2} / span ${width}`,
    gridRow: `${y + 2} / span ${height}`,
});

export const objectColorVars = (color?: ObjectTypeColor): CSSProperties =>
    color
        ? ({
              '--obj-bg': color.lightBg,
              '--obj-fg': color.lightText,
              '--obj-bg-dark': color.darkBg,
              '--obj-fg-dark': color.darkText,
          } as CSSProperties)
        : {};

/** Solid swatch/background in the object's color; pair with objectColorVars. */
export const objectColorClass =
    'bg-[var(--obj-bg,var(--sunken))] text-[var(--obj-fg,var(--foreground))] dark:bg-[var(--obj-bg-dark,var(--sunken))] dark:text-[var(--obj-fg-dark,var(--foreground))]';
