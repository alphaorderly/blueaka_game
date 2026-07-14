import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventData } from '@/types/inventory-management/inventory';
import { toast } from 'react-hot-toast';

interface CreateEventSectionProps {
    onCreateEvent: (name: string, description?: string) => EventData;
}

export const CreateEventSection: React.FC<CreateEventSectionProps> = ({
    onCreateEvent,
}) => {
    const [newEventName, setNewEventName] = useState<string>('');
    const [newEventDescription, setNewEventDescription] = useState<string>('');

    const handleCreateEvent = () => {
        if (!newEventName.trim()) {
            return;
        }

        try {
            onCreateEvent(
                newEventName.trim(),
                newEventDescription.trim() || undefined
            );
            setNewEventName('');
            setNewEventDescription('');
        } catch {
            toast.error('이벤트 생성에 실패했습니다.');
        }
    };

    return (
        <div className="space-y-4 rounded-lg border border-none bg-none p-4">
            <div>
                <h3 className="text-foreground text-base font-semibold">
                    새 커스텀 이벤트 만들기
                </h3>
            </div>

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label
                        htmlFor="event-name"
                        className="text-muted-foreground"
                    >
                        이벤트 이름 *
                    </Label>
                    <Input
                        id="event-name"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="새 이벤트 이름을 입력하세요"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label
                        htmlFor="event-description"
                        className="text-muted-foreground"
                    >
                        설명 (선택사항)
                    </Label>
                    <Input
                        id="event-description"
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                        placeholder="이벤트 설명을 입력하세요"
                    />
                </div>
            </div>

            <Button
                onClick={handleCreateEvent}
                className="w-full"
                disabled={!newEventName.trim()}
            >
                커스텀 이벤트 생성
            </Button>
        </div>
    );
};
