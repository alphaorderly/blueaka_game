import { RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InventoryObject } from '@/types/inventory-management/inventory';
import type { ObjectTypeColor } from '@/utils/inventory/colorUtils';
import { cn } from '@/lib/utils';
import { ShapeGlyph } from './board/Board';
import { objectColorClass, objectColorVars } from './board/boardUtils';

interface InventoryPlacementIndicatorProps {
    selectedObjectIndex: number;
    currentObjects: InventoryObject[];
    color?: ObjectTypeColor;
    placementOrientation: 'horizontal' | 'vertical';
    onToggleOrientation: () => void;
    onCancelPlacement: () => void;
}

const Kbd = ({ children }: { children: string }) => (
    <kbd className="border-primary-foreground/30 text-primary-foreground/80 ml-0.5 hidden rounded-[3px] border px-1 font-sans text-[10px] leading-4 sm:inline">
        {children}
    </kbd>
);

export const InventoryPlacementIndicator = ({
    selectedObjectIndex,
    currentObjects,
    color,
    placementOrientation,
    onToggleOrientation,
    onCancelPlacement,
}: InventoryPlacementIndicatorProps) => {
    const current = currentObjects[selectedObjectIndex];
    if (!current) return null;

    const [w, h] =
        placementOrientation === 'horizontal'
            ? [current.w, current.h]
            : [current.h, current.w];

    return (
        <div className="bg-primary text-primary-foreground flex h-11 items-center gap-3 rounded-t-xl px-3 sm:px-4">
            <span
                className={cn(
                    objectColorClass,
                    'tabular flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[11px] font-semibold'
                )}
                style={objectColorVars(color)}
            >
                {selectedObjectIndex + 1}
            </span>
            <ShapeGlyph w={w} h={h} className="opacity-90" />
            <span className="tabular text-[13px] font-semibold">
                {w}×{h}
            </span>

            <div className="ml-auto flex items-center gap-1">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onToggleOrientation}
                    className="text-primary-foreground hover:text-primary-foreground hover:bg-white/15 dark:hover:bg-black/10"
                >
                    <RotateCw />
                    회전
                    <Kbd>R</Kbd>
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancelPlacement}
                    className="text-primary-foreground hover:text-primary-foreground hover:bg-white/15 dark:hover:bg-black/10"
                >
                    <X />
                    취소
                    <Kbd>Esc</Kbd>
                </Button>
            </div>
        </div>
    );
};
