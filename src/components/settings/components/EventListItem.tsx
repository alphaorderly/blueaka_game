import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { EventData, GameObject } from '../../../types/calculator';
import {
    Download,
    Copy,
    Edit3,
    Trash2,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

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
    onSelectEvent,
    onUpdateEvent,
    onDeleteEvent,
    onExportToFile,
    onExportToClipboard,
    onAddCase,
    onRemoveCase,
    onAddObject,
    onRemoveObject,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(event.name);
    const [editDescription, setEditDescription] = useState(
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

    const handleUpdateEvent = () => {
        onUpdateEvent(event.id, {
            name: editName.trim(),
            description: editDescription.trim() || undefined,
        });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditName(event.name);
        setEditDescription(event.description || '');
        setIsEditing(false);
    };

    const handleExportToFile = () => {
        onExportToFile(event.id);
    };

    const handleExportToClipboard = () => {
        onExportToClipboard(event.id);
    };

    return (
        <Card
            className={`transition-all duration-200 ${
                isSelected
                    ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                    : 'border-border/40 hover:bg-card/80'
            }`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    {/* Selection Radio */}
                    <input
                        type="radio"
                        id={`event-${event.id}`}
                        name="selectedEvent"
                        checked={isSelected}
                        onChange={() => onSelectEvent(event.id)}
                        className="text-primary focus:ring-primary h-4 w-4"
                    />

                    {/* Expand/Collapse Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-6 w-6 p-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>

                    {/* Event Info */}
                    <div className="min-w-0 flex-1">
                        {isEditing ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    className="focus:ring-primary w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
                                    placeholder="이벤트 이름"
                                />
                                <input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) =>
                                        setEditDescription(e.target.value)
                                    }
                                    className="focus:ring-primary w-full rounded border px-2 py-1 text-xs focus:ring-2 focus:outline-none"
                                    placeholder="이벤트 설명 (선택사항)"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleUpdateEvent}
                                        size="sm"
                                        variant="default"
                                        disabled={!editName.trim()}
                                    >
                                        저장
                                    </Button>
                                    <Button
                                        onClick={handleCancelEdit}
                                        size="sm"
                                        variant="outline"
                                    >
                                        취소
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <label
                                htmlFor={`event-${event.id}`}
                                className="block cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-foreground truncate font-medium">
                                        {event.name}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {event.caseOptions.length}개 케이스
                                    </Badge>
                                </div>
                                {event.description && (
                                    <p className="text-muted-foreground mt-1 truncate text-xs">
                                        {event.description}
                                    </p>
                                )}
                            </label>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                        {!isEditing && (
                            <>
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="이벤트 편집"
                                >
                                    <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                    onClick={handleExportToFile}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="파일로 내보내기"
                                >
                                    <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                    onClick={handleExportToClipboard}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="클립보드에 복사"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                    onClick={handleDeleteEvent}
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                    title="이벤트 삭제"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>

            {/* Expanded Content */}
            {isExpanded && (
                <CardContent className="pt-0">
                    <div className="space-y-3 border-t pt-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-foreground text-sm font-medium">
                                케이스 목록
                            </h4>
                            <Button
                                onClick={() => onAddCase(event.id)}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                            >
                                케이스 추가
                            </Button>
                        </div>

                        {event.caseOptions.length === 0 ? (
                            <div className="py-4 text-center">
                                <p className="text-muted-foreground text-sm">
                                    케이스가 없습니다.
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    케이스를 추가해보세요.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {event.caseOptions.map((caseOption, index) => (
                                    <div
                                        key={caseOption.value}
                                        className="bg-card/30 rounded-lg border p-3"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    케이스 {index + 1}
                                                </Badge>
                                                <span className="text-sm font-medium">
                                                    {caseOption.label}
                                                </span>
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
                                                className="text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-muted-foreground text-xs">
                                                오브젝트:{' '}
                                                {caseOption.objects.length}개
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                                                {caseOption.objects.map(
                                                    (obj, objIndex) => (
                                                        <div
                                                            key={objIndex}
                                                            className="bg-background/50 flex items-center justify-between rounded px-2 py-1 text-xs"
                                                        >
                                                            <span>
                                                                {obj.w}×{obj.h}{' '}
                                                                (
                                                                {obj.totalCount}
                                                                개)
                                                            </span>
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
                                                                className="text-destructive hover:bg-destructive/10 ml-1 h-4 w-4 p-0"
                                                            >
                                                                <Trash2 className="h-2 w-2" />
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                            <Button
                                                onClick={() =>
                                                    onAddObject(
                                                        event.id,
                                                        caseOption.value
                                                    )
                                                }
                                                variant="outline"
                                                size="sm"
                                                className="h-6 w-full text-xs"
                                            >
                                                오브젝트 추가
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
