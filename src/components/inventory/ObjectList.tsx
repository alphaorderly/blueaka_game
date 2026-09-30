import type { InventoryObject } from '@/types/inventory-management/inventory';
import type { ObjectTypeColor } from '@/utils/inventory/colorUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShapeGlyph } from './board/Board';
import { objectColorClass, objectColorVars } from './board/boardUtils';

interface ObjectListProps {
    objects: InventoryObject[];
    colors: { [objectIndex: number]: ObjectTypeColor };
    remainingCounts: number[];
    filter: number | null;
    placingIndex: number;
    onFilterChange: (index: number | null) => void;
    onStartPlacing: (index: number) => void;
}

export const ObjectList = ({
    objects,
    colors,
    remainingCounts,
    filter,
    placingIndex,
    onFilterChange,
    onStartPlacing,
}: ObjectListProps) => {
    return (
        <ul className="-mx-1.5 grid gap-0.5">
            {objects.map((obj, index) => {
                const remaining = remainingCounts[index] ?? obj.totalCount;
                const isFiltered = filter === index;
                const isPlacing = placingIndex === index;

                return (
                    <li
                        key={index}
                        className={cn(
                            'group relative flex items-center gap-1 rounded-md pr-1.5 transition-colors',
                            isFiltered ? 'bg-primary-soft' : 'hover:bg-accent'
                        )}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                onFilterChange(isFiltered ? null : index)
                            }
                            aria-pressed={isFiltered}
                            title="이 오브젝트 확률만 보기"
                            className="focus-visible:ring-ring/40 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md py-2 pl-1.5 text-left outline-none focus-visible:ring-2"
                        >
                            <span
                                className={cn(
                                    objectColorClass,
                                    'tabular flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[11px] font-semibold'
                                )}
                                style={objectColorVars(colors[index])}
                            >
                                {index + 1}
                            </span>
                            <span className="text-muted-foreground flex w-9 shrink-0 justify-center">
                                <ShapeGlyph w={obj.w} h={obj.h} />
                            </span>
                            <span className="tabular text-[13px] font-medium">
                                {obj.w}×{obj.h}
                            </span>
                            <span
                                className={cn(
                                    'tabular ml-auto text-xs',
                                    remaining === 0
                                        ? 'text-faint'
                                        : 'text-muted-foreground'
                                )}
                            >
                                {remaining}
                                <span className="text-faint">
                                    {' '}
                                    / {obj.totalCount}
                                </span>
                            </span>
                        </button>
                        <Button
                            size="xs"
                            variant={isPlacing ? 'default' : 'outline'}
                            disabled={remaining === 0}
                            onClick={() => onStartPlacing(index)}
                            className="w-12"
                        >
                            {isPlacing ? '배치 중' : '배치'}
                        </Button>
                    </li>
                );
            })}
        </ul>
    );
};
