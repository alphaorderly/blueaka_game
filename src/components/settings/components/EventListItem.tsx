import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { EventData, GameObject } from '../../../types/calculator';
import { Download, Copy, Trash2, Plus, X } from 'lucide-react';

interface EventListItemProps {
    event: EventData;
    selectedEvent: string;
    onSelectEvent: (eventId: string) => void;
    onUpdateEvent: (eventId: string, updates: Partial<EventData>) => void;
    onDeleteEvent: (eventId: string) => void;
    onExportToFile: (eventId: string) => void;
    onExportToClipboard: (eventId: string) => void;
    onAddCase: (eventId: string) => void;
    onRemoveCase: (eventId: string, caseId: string) => void;
    onUpdateCase: (
        eventId: string,
        caseId: string,
        updates: Partial<{ label: string; objects: GameObject[] }>
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => onExportToFile(event.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        title="파일로 내보내기"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={() => onExportToClipboard(event.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        title="클립보드에 복사"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleDeleteEvent}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="이벤트 삭제"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <Badge
                        variant="outline"
                        className="border-gray-300 bg-gray-100 text-xs text-gray-600"
                    >
                        {event.caseOptions.length}개 케이스
                    </Badge>
                </div>
            </div>

            {/* Event Info - Wide Layout without Border */}
            <div
                className={`space-y-4 rounded-lg p-4 transition-colors ${
                    isSelected ? 'bg-gray-50' : 'bg-gray-25 hover:bg-gray-50'
                }`}
            >
                <div className="space-y-2">
                    <Label
                        htmlFor={`name-${event.id}`}
                        className="text-sm font-medium text-gray-700"
                    >
                        이벤트 이름
                    </Label>
                    <Input
                        id={`name-${event.id}`}
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        onBlur={(e) => handleUpdateEventName(e.target.value)}
                        className="border-0 bg-white text-lg font-medium shadow-sm focus:ring-2 focus:ring-gray-400"
                        placeholder="이벤트 이름을 입력하세요"
                    />
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor={`desc-${event.id}`}
                        className="text-sm font-medium text-gray-700"
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
                        className="border-0 bg-white text-sm shadow-sm focus:ring-2 focus:ring-gray-400"
                        placeholder="이벤트에 대한 설명을 입력하세요"
                    />
                </div>
            </div>

            {/* Cases List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                        케이스 목록
                    </h3>
                    <Button
                        onClick={() => onAddCase(event.id)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        케이스 추가
                    </Button>
                </div>

                {event.caseOptions.length === 0 ? (
                    <Card className="border-dashed border-gray-300">
                        <CardContent className="pt-6 pb-6 text-center">
                            <p className="text-sm text-gray-500">
                                케이스가 없습니다
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                위 버튼을 클릭해서 케이스를 추가해보세요
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {event.caseOptions.map((caseOption, caseIndex) => (
                            <Card
                                key={caseOption.value}
                                className="border-gray-200 py-2"
                            >
                                <CardContent className="pt-4 pb-4">
                                    {/* Case Header */}
                                    <div className="mb-4 flex items-center gap-3">
                                        <Badge
                                            variant="secondary"
                                            className="border-gray-300 bg-gray-100 text-gray-700"
                                        >
                                            케이스 {caseIndex + 1}
                                        </Badge>
                                        <div className="flex-1">
                                            <Input
                                                value={caseOption.label}
                                                onChange={(e) =>
                                                    handleCaseLabelChange(
                                                        caseOption.value,
                                                        e.target.value
                                                    )
                                                }
                                                className="border-gray-300 font-medium focus:border-gray-500 focus:ring-gray-500"
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
                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            title="케이스 삭제"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Objects */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-gray-700">
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
                                                className="h-7 border-gray-300 text-xs text-gray-600 hover:bg-gray-50"
                                            >
                                                <Plus className="mr-1 h-3 w-3" />
                                                오브젝트 추가
                                            </Button>
                                        </div>

                                        {caseOption.objects.length === 0 ? (
                                            <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                                                <p className="text-sm text-gray-400">
                                                    오브젝트가 없습니다
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {caseOption.objects.map(
                                                    (obj, objIndex) => (
                                                        <div
                                                            key={objIndex}
                                                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-gray-300 bg-white text-xs text-gray-600"
                                                                >
                                                                    #
                                                                    {objIndex +
                                                                        1}
                                                                </Badge>

                                                                <div className="grid flex-1 grid-cols-3 gap-3">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-gray-600">
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
                                                                                            .value
                                                                                    )
                                                                                )
                                                                            }
                                                                            className="h-8 border-gray-300 text-center text-sm focus:border-gray-500 focus:ring-gray-500"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-gray-600">
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
                                                                                            .value
                                                                                    )
                                                                                )
                                                                            }
                                                                            className="h-8 border-gray-300 text-center text-sm focus:border-gray-500 focus:ring-gray-500"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-gray-600">
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
                                                                                            .value
                                                                                    )
                                                                                )
                                                                            }
                                                                            className="h-8 border-gray-300 text-center text-sm focus:border-gray-500 focus:ring-gray-500"
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
                                                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                                                                    title="오브젝트 삭제"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            {/* Object Summary */}
                                                            <div className="mt-2 border-t border-gray-200 pt-2">
                                                                <p className="text-xs text-gray-500">
                                                                    크기:{' '}
                                                                    {obj.w} ×{' '}
                                                                    {obj.h} ={' '}
                                                                    {obj.w *
                                                                        obj.h}
                                                                    칸 | 총{' '}
                                                                    {
                                                                        obj.totalCount
                                                                    }
                                                                    개
                                                                </p>
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
