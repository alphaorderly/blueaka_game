import React, { useRef, useState } from 'react';
import { ClipboardPaste, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ImportExportSectionProps {
    /** Returns whether the import succeeded. */
    onImportEvent: (jsonString: string) => boolean;
}

export const ImportExportSection: React.FC<ImportExportSectionProps> = ({
    onImportEvent,
}) => {
    const [importText, setImportText] = useState('');
    const [showTextImport, setShowTextImport] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            onImportEvent(await file.text());
        } catch (error) {
            toast.error('파일을 읽을 수 없음');
            console.error('Import error:', error);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTextImport = () => {
        if (!importText.trim()) return;
        if (onImportEvent(importText)) {
            setImportText('');
            setShowTextImport(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
                <Button
                    variant="outline"
                    size="xs"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileUp className="size-3.5" />
                    파일
                </Button>
                <Button
                    variant={showTextImport ? 'secondary' : 'outline'}
                    size="xs"
                    onClick={() => setShowTextImport((open) => !open)}
                    aria-expanded={showTextImport}
                >
                    <ClipboardPaste className="size-3.5" />
                    JSON
                </Button>
            </div>

            {showTextImport && (
                <div className="space-y-1.5">
                    <Textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="{ … }"
                        aria-label="이벤트 JSON"
                        rows={4}
                        className="max-h-40 font-mono text-xs md:text-xs"
                    />
                    <Button
                        size="xs"
                        className="w-full"
                        onClick={handleTextImport}
                        disabled={!importText.trim()}
                    >
                        가져오기
                    </Button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFile}
                className="hidden"
            />
        </div>
    );
};
