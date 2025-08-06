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
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
                <h3 className="text-base font-semibold text-gray-900">
                    새 커스텀 이벤트 만들기
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                    새로운 확률 계산 이벤트를 생성할 수 있습니다
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <Label
                        htmlFor="event-name"
                        className="text-sm font-medium text-gray-700"
                    >
                        이벤트 이름 *
                    </Label>
                    <Input
                        id="event-name"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="새 이벤트 이름을 입력하세요"
                        className="mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    />
                </div>
                <div>
                    <Label
                        htmlFor="event-description"
                        className="text-sm font-medium text-gray-700"
                    >
                        설명 (선택사항)
                    </Label>
                    <Input
                        id="event-description"
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                        placeholder="이벤트 설명을 입력하세요"
                        className="mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    />
                </div>
            </div>

            <Button
                onClick={handleCreateEvent}
                className="w-full bg-gray-900 text-white hover:bg-gray-800"
                disabled={!newEventName.trim()}
            >
                커스텀 이벤트 생성
            </Button>
        </div>
    );
};
