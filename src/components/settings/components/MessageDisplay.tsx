import React from 'react';

interface MessageDisplayProps {
    message: {
        type: 'success' | 'error';
        text: string;
    } | null;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div
            className={`rounded-lg border p-3 text-sm font-medium ${
                message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
            }`}
        >
            {message.text}
        </div>
    );
};
