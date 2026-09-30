import React, { useState } from 'react';
import { Copy, Download, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    EventData,
    InventoryObject,
} from '@/types/inventory-management/inventory';
import { ShapeGlyph } from '@/components/inventory/board/Board';

interface EventListItemProps {
    event: EventData;
    onUpdateEvent: (eventId: string, updates: Partial<EventData>) => void;
    onExportFile: (eventId: string) => void;
    onCopy: (eventId: string) => void;
    onDelete: (eventId: string) => void;
    onAddCase: (eventId: string) => void;
    onRemoveCase: (eventId: string, caseId: string) => void;
    onUpdateCase: (
        eventId: string,
        caseId: string,
        updates: Partial<{ label: string; objects: InventoryObject[] }>
    ) => void;
    onAddObject: (eventId: string, caseId: string) => void;
    onRemoveObject: (
        eventId: string,
        caseId: string,
        objectIndex: number
    ) => void;
    onUpdateObject: (
        eventId: string,
        caseId: string,
        objectIndex: number,
        updates: Partial<{ w: number; h: number; totalCount: number }>
    ) => void;
}

const OBJECT_FIELDS = [
    { key: 'w', label: '너비' },
    { key: 'h', label: '높이' },
    { key: 'totalCount', label: '개수' },
] as const;

export const EventListItem: React.FC<EventListItemProps> = ({
    event,
    onUpdateEvent,
    onExportFile,
    onCopy,
    onDelete,
    onAddCase,
    onRemoveCase,
    onUpdateCase,
    onAddObject,
    onRemoveObject,
    onUpdateObject,
}) => {
    const [eventName, setEventName] = useState(event.name);
    const [eventDescription, setEventDescription] = useState(
        event.description || ''
    );

    const commitName = (value: string) => {
        if (value.trim()) {
            onUpdateEvent(event.id, { name: value.trim() });
        } else {
            setEventName(event.name);
        }
    };

    const commitDescription = (value: string) => {
        onUpdateEvent(event.id, { description: value.trim() || undefined });
    };

    const handleObjectChange = (
        caseId: string,
        objectIndex: number,
        field: 'w' | 'h' | 'totalCount',
        value: number
    ) => {
        onUpdateObject(event.id, caseId, objectIndex, {
            [field]: Math.max(1, value || 1),
        });
    };

    return (
        <div className="space-y-6 p-4 sm:p-5">
            <div className="space-y-3">
                <div className="flex items-end gap-2">
                    <div className="grid min-w-0 flex-1 gap-1.5">
                        <Label htmlFor={`name-${event.id}`}>이름</Label>
                        <Input
                            id={`name-${event.id}`}
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            onBlur={(e) => commitName(e.target.value)}
                            className="font-medium"
                        />
                    </div>
                    <div className="flex gap-0.5 pb-0.5">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onExportFile(event.id)}
                            aria-label="파일로 내보내기"
                            title="파일로 내보내기"
                        >
                            <Download />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onCopy(event.id)}
                            aria-label="JSON 복사"
                            title="JSON 복사"
                        >
                            <Copy />
                        </Button>
                        <Button
                            variant="ghost-danger"
                            size="icon-sm"
                            onClick={() => onDelete(event.id)}
                            aria-label="삭제"
                            title="삭제"
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor={`desc-${event.id}`}>메모</Label>
                    <Input
                        id={`desc-${event.id}`}
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        onBlur={(e) => commitDescription(e.target.value)}
                    />
                </div>
            </div>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold">
                        회차
                        <span className="text-faint tabular ml-1.5 font-normal">
                            {event.caseOptions.length}
                        </span>
                    </h3>
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onAddCase(event.id)}
                    >
                        <Plus className="size-3.5" />
                        회차
                    </Button>
                </div>

                {event.caseOptions.length === 0 ? (
                    <p className="text-faint rounded-lg border border-dashed py-8 text-center text-xs">
                        회차 없음
                    </p>
                ) : (
                    <div className="space-y-3">
                        {event.caseOptions.map((caseOption) => (
                            <div
                                key={caseOption.value}
                                className="overflow-hidden rounded-lg border"
                            >
                                <div className="bg-sunken flex items-center gap-2 border-b px-2 py-1.5">
                                    <Input
                                        value={caseOption.label}
                                        onChange={(e) =>
                                            onUpdateCase(
                                                event.id,
                                                caseOption.value,
                                                { label: e.target.value }
                                            )
                                        }
                                        aria-label="회차 이름"
                                        placeholder="회차 이름"
                                        className="focus-visible:bg-surface h-8 border-transparent bg-transparent font-medium hover:border-transparent"
                                    />
                                    <Button
                                        variant="ghost-danger"
                                        size="icon-xs"
                                        onClick={() =>
                                            onRemoveCase(
                                                event.id,
                                                caseOption.value
                                            )
                                        }
                                        aria-label="회차 삭제"
                                        title="회차 삭제"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>

                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="text-faint text-left text-[11px]">
                                            <th className="w-10 py-2 pl-3 font-medium">
                                                #
                                            </th>
                                            <th className="w-12 font-medium" />
                                            {OBJECT_FIELDS.map((field) => (
                                                <th
                                                    key={field.key}
                                                    className="px-1 font-medium"
                                                >
                                                    {field.label}
                                                </th>
                                            ))}
                                            <th className="w-10" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {caseOption.objects.map(
                                            (obj, objIndex) => (
                                                <tr
                                                    key={objIndex}
                                                    className="border-t"
                                                >
                                                    <td className="text-muted-foreground tabular py-1.5 pl-3 text-xs">
                                                        {objIndex + 1}
                                                    </td>
                                                    <td className="text-muted-foreground">
                                                        <ShapeGlyph
                                                            w={Math.min(
                                                                obj.w,
                                                                6
                                                            )}
                                                            h={Math.min(
                                                                obj.h,
                                                                6
                                                            )}
                                                        />
                                                    </td>
                                                    {OBJECT_FIELDS.map(
                                                        (field) => (
                                                            <td
                                                                key={field.key}
                                                                className="px-1 py-1.5"
                                                            >
                                                                <Input
                                                                    type="number"
                                                                    inputMode="numeric"
                                                                    min={1}
                                                                    value={
                                                                        obj[
                                                                            field
                                                                                .key
                                                                        ]
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleObjectChange(
                                                                            caseOption.value,
                                                                            objIndex,
                                                                            field.key,
                                                                            parseInt(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                                10
                                                                            )
                                                                        )
                                                                    }
                                                                    aria-label={`${objIndex + 1}번 ${field.label}`}
                                                                    className="tabular h-8 max-w-20 text-center"
                                                                />
                                                            </td>
                                                        )
                                                    )}
                                                    <td className="pr-2 text-right">
                                                        <Button
                                                            variant="ghost-danger"
                                                            size="icon-xs"
                                                            onClick={() =>
                                                                onRemoveObject(
                                                                    event.id,
                                                                    caseOption.value,
                                                                    objIndex
                                                                )
                                                            }
                                                            aria-label={`${objIndex + 1}번 삭제`}
                                                            title="삭제"
                                                        >
                                                            <X className="size-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>

                                <button
                                    type="button"
                                    onClick={() =>
                                        onAddObject(event.id, caseOption.value)
                                    }
                                    className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full cursor-pointer items-center gap-1.5 border-t px-3 py-2 text-xs transition-colors"
                                >
                                    <Plus className="size-3.5" />
                                    오브젝트
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
