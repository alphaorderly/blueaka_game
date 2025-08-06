import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { EventData } from '../../../types/calculator';

interface CreateEventSectionProps {
    onCreateEvent: (name: string, description?: string) => EventData;
    onShowMessage: (type: 'success' | 'error', text: string) => void;
    onEventCreated: (eventId: string) => void;
}

export const CreateEventSection: React.FC<CreateEventSectionProps> = ({
    onCreateEvent,
    onShowMessage,
    onEventCreated,
}) => {
    const [newEventName, setNewEventName] = useState<string>('');
    const [newEventDescription, setNewEventDescription] = useState<string>('');

    const handleCreateEvent = () => {
        if (!newEventName.trim()) {
            onShowMessage('error', '이벤트 이름을 입력해주세요.');
            return;
        }

        try {
            const newEvent = onCreateEvent(
                newEventName.trim(),
                newEventDescription.trim() || undefined
            );
            setNewEventName('');
            setNewEventDescription('');
            onEventCreated(newEvent.id);
            onShowMessage(
                'success',
                `커스텀 이벤트 "${newEvent.name}"가 생성되었습니다!`
            );
        } catch {
            onShowMessage('error', '이벤트 생성에 실패했습니다.');
        }
    };

    return (
        <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
            <Label className="text-base font-semibold">
                새 커스텀 이벤트 만들기
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <Label htmlFor="event-name" className="text-sm font-medium">
                        이벤트 이름 *
                    </Label>
                    <Input
                        id="event-name"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="새 이벤트 이름을 입력하세요"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label
                        htmlFor="event-description"
                        className="text-sm font-medium"
                    >
                        설명 (선택사항)
                    </Label>
                    <Input
                        id="event-description"
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                        placeholder="이벤트 설명을 입력하세요"
                        className="mt-1"
                    />
                </div>
            </div>
            <Button onClick={handleCreateEvent} className="w-full sm:w-auto">
                커스텀 이벤트 생성
            </Button>
        </div>
    );
};
