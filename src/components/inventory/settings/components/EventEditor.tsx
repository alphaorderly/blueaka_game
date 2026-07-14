import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventData } from '@/types/inventory-management/inventory';

interface EventEditorProps {
    event: EventData;
    onUpdateEvent: (eventId: string, updates: Partial<EventData>) => void;
    onShowMessage: (type: 'success' | 'error', text: string) => void;
}

export const EventEditor: React.FC<EventEditorProps> = ({
    event,
    onUpdateEvent,
    onShowMessage,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventData | null>(null);

    const handleEditEvent = () => {
        setEditingEvent({ ...event });
        setIsEditing(true);
    };

    const handleSaveEditEvent = () => {
        if (!editingEvent) return;

        if (!editingEvent.name.trim()) {
            onShowMessage('error', '이벤트 이름을 입력해주세요.');
            return;
        }

        onUpdateEvent(editingEvent.id, {
            name: editingEvent.name.trim(),
            description: editingEvent.description?.trim() || undefined,
        });

        setEditingEvent(null);
        setIsEditing(false);
        onShowMessage('success', '이벤트 정보가 업데이트되었습니다!');
    };

    const handleCancelEdit = () => {
        setEditingEvent(null);
        setIsEditing(false);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                    이벤트 정보 편집
                </Label>
                <Button onClick={handleEditEvent} variant="outline" size="sm">
                    편집
                </Button>
            </div>

            {isEditing && editingEvent && (
                <div className="bg-muted space-y-3 rounded-lg p-3">
                    <div>
                        <Label className="text-sm">이벤트 이름</Label>
                        <Input
                            value={editingEvent.name}
                            onChange={(e) =>
                                setEditingEvent({
                                    ...editingEvent,
                                    name: e.target.value,
                                })
                            }
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-sm">설명</Label>
                        <Input
                            value={editingEvent.description || ''}
                            onChange={(e) =>
                                setEditingEvent({
                                    ...editingEvent,
                                    description: e.target.value,
                                })
                            }
                            className="mt-1"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSaveEditEvent} size="sm">
                            저장
                        </Button>
                        <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            size="sm"
                        >
                            취소
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
