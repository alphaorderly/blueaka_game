import React, { useState } from 'react';
import { Copy, Download, Plus, Trash2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    EventData,
    InventoryObject,
} from '@/types/inventory-management/inventory';

interface EventListItemProps {
    event: EventData;
    selectedEvent: string;
    onUpdateEvent: (eventId: string, updates: Partial<EventData>) => void;
    onDeleteEvent: (eventId: string) => void;
    onExportToFile: (eventId: string) => void;
    onExportToClipboard: (eventId: string) => void;
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

export const EventListItem: React.FC<EventListItemProps> = ({
    event,
    selectedEvent,
    onUpdateEvent,
    onDeleteEvent,
    onExportToFile,
    onExportToClipboard,
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

    const isSelected = selectedEvent === event.id;

    const handleDeleteEvent = () => {
        if (
            window.confirm(
                `정말로 "${event.name}" 이벤트를 삭제하시겠습니까?\n\n모든 케이스와 설정이 함께 삭제됩니다.`
            )
        ) {
            onDeleteEvent(event.id);
        }
    };

    const handleUpdateEventName = (newName: string) => {
        setEventName(newName);
        if (newName.trim()) {
            onUpdateEvent(event.id, { name: newName.trim() });
        }
    };

    const handleUpdateEventDescription = (newDescription: string) => {
        setEventDescription(newDescription);
        onUpdateEvent(event.id, {
            description: newDescription.trim() || undefined,
        });
    };

    const handleCaseLabelChange = (caseId: string, newLabel: string) => {
        onUpdateCase(event.id, caseId, { label: newLabel });
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
        <div className="space-y-4">
            {/* Event Header - Action Buttons */}
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => onExportToFile(event.id)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/40 h-8 w-8 p-0"
                        title="파일로 내보내기"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={() => onExportToClipboard(event.id)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/40 h-8 w-8 p-0"
                        title="클립보드에 복사"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleDeleteEvent}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        title="이벤트 삭제"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                        {event.caseOptions.length}개 케이스
                    </Badge>
                </div>
            </div>

            {/* Event Info */}
            <div
                className={cn(
                    'space-y-4 rounded-lg p-4 transition-colors',
                    isSelected
                        ? 'bg-accent/30 dark:bg-accent/10'
                        : 'bg-muted/30 hover:bg-muted/40 dark:bg-muted/10 dark:hover:bg-muted/20'
                )}
            >
                <div className="space-y-2">
                    <Label
                        htmlFor={`name-${event.id}`}
                        className="text-muted-foreground text-sm font-medium"
                    >
                        이벤트 이름
                    </Label>
                    <Input
                        id={`name-${event.id}`}
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        onBlur={(e) => handleUpdateEventName(e.target.value)}
                        className="text-lg font-semibold"
                        placeholder="이벤트 이름을 입력하세요"
                    />
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor={`desc-${event.id}`}
                        className="text-muted-foreground text-sm font-medium"
                    >
                        설명 (선택사항)
                    </Label>
                    <Input
                        id={`desc-${event.id}`}
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        onBlur={(e) =>
                            handleUpdateEventDescription(e.target.value)
                        }
                        className="text-sm"
                        placeholder="이벤트에 대한 설명을 입력하세요"
                    />
                </div>
            </div>

            {/* Cases List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-foreground text-sm font-medium">
                        케이스 목록
                    </h3>
                    <Button
                        onClick={() => onAddCase(event.id)}
                        variant="outline"
                        size="sm"
                        className="text-sm"
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        케이스 추가
                    </Button>
                </div>

                {event.caseOptions.length === 0 ? (
                    <Card className="border-border/60 dark:border-border/40 border-dashed">
                        <CardContent className="space-y-1 px-4 py-6 text-center">
                            <p className="text-muted-foreground text-sm">
                                케이스가 없습니다
                            </p>
                            <p className="text-muted-foreground/80 text-xs">
                                위 버튼을 클릭해서 케이스를 추가해보세요
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {event.caseOptions.map((caseOption) => (
                            <Card
                                key={caseOption.value}
                                className="border-border/60 dark:border-border/40 py-2"
                            >
                                <CardContent className="space-y-4 px-4 py-4">
                                    {/* Case Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <Input
                                                value={caseOption.label}
                                                onChange={(e) =>
                                                    handleCaseLabelChange(
                                                        caseOption.value,
                                                        e.target.value
                                                    )
                                                }
                                                className="font-medium"
                                                placeholder="케이스 이름"
                                            />
                                        </div>
                                        <Button
                                            onClick={() =>
                                                onRemoveCase(
                                                    event.id,
                                                    caseOption.value
                                                )
                                            }
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                            title="케이스 삭제"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Objects */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-muted-foreground text-sm font-medium">
                                                오브젝트 (
                                                {caseOption.objects.length}개)
                                            </Label>
                                            <Button
                                                onClick={() =>
                                                    onAddObject(
                                                        event.id,
                                                        caseOption.value
                                                    )
                                                }
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs"
                                            >
                                                <Plus className="mr-1 h-3 w-3" />
                                                오브젝트 추가
                                            </Button>
                                        </div>

                                        {caseOption.objects.length === 0 ? (
                                            <div className="border-border/60 dark:border-border/40 rounded-lg border-2 border-dashed p-4 text-center">
                                                <p className="text-muted-foreground/80 text-sm">
                                                    오브젝트가 없습니다
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {caseOption.objects.map(
                                                    (obj, objIndex) => (
                                                        <div
                                                            key={objIndex}
                                                            className="border-border/60 bg-muted/30 dark:border-border/40 dark:bg-muted/15 rounded-lg border p-3"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-background/80 text-muted-foreground self-center text-xs"
                                                                >
                                                                    #
                                                                    {objIndex +
                                                                        1}
                                                                </Badge>

                                                                <div className="grid flex-1 grid-cols-3 gap-3">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-muted-foreground text-xs">
                                                                            너비
                                                                        </Label>
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            value={
                                                                                obj.w
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleObjectChange(
                                                                                    caseOption.value,
                                                                                    objIndex,
                                                                                    'w',
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                        10
                                                                                    )
                                                                                )
                                                                            }
                                                                            className="h-8 text-center text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-muted-foreground text-xs">
                                                                            높이
                                                                        </Label>
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            value={
                                                                                obj.h
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleObjectChange(
                                                                                    caseOption.value,
                                                                                    objIndex,
                                                                                    'h',
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                        10
                                                                                    )
                                                                                )
                                                                            }
                                                                            className="h-8 text-center text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-muted-foreground text-xs">
                                                                            총
                                                                            개수
                                                                        </Label>
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            value={
                                                                                obj.totalCount
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleObjectChange(
                                                                                    caseOption.value,
                                                                                    objIndex,
                                                                                    'totalCount',
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                        10
                                                                                    )
                                                                                )
                                                                            }
                                                                            className="h-8 text-center text-sm"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    onClick={() =>
                                                                        onRemoveObject(
                                                                            event.id,
                                                                            caseOption.value,
                                                                            objIndex
                                                                        )
                                                                    }
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:bg-destructive/15 h-8 w-8 self-end p-0"
                                                                    title="오브젝트 삭제"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
