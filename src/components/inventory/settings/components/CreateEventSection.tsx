import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateEventSectionProps {
    onCreateEvent: (name: string) => void;
}

export const CreateEventSection: React.FC<CreateEventSectionProps> = ({
    onCreateEvent,
}) => {
    const [name, setName] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
            onCreateEvent(trimmed);
            setName('');
        } catch {
            toast.error('생성 실패');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-1.5">
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="새 이벤트 이름"
                aria-label="새 이벤트 이름"
                className="h-8"
            />
            <Button
                type="submit"
                size="icon-sm"
                disabled={!name.trim()}
                aria-label="추가"
                title="추가"
            >
                <Plus />
            </Button>
        </form>
    );
};
