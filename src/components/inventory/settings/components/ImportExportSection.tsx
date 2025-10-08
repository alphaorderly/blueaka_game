import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, FolderOpen } from 'lucide-react';

interface ImportExportSectionProps {
    onImportEvent: (jsonString: string) => {
        success: boolean;
        message: string;
        eventId?: string;
    };
    onShowMessage: (type: 'success' | 'error', text: string) => void;
    onEventImported: (eventId?: string) => void;
}

export const ImportExportSection: React.FC<ImportExportSectionProps> = ({
    onImportEvent,
    onShowMessage,
    onEventImported,
}) => {
    const [importText, setImportText] = useState<string>('');
    const [showTextImport, setShowTextImport] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        resolve(e.target.result as string);
                    } else {
                        reject(new Error('Failed to read file'));
                    }
                };
                reader.onerror = () => reject(new Error('File reading error'));
                reader.readAsText(file);
            });

            const result = onImportEvent(content);
            onShowMessage(result.success ? 'success' : 'error', result.message);

            if (result.success && result.eventId) {
                onEventImported(result.eventId);
            }
        } catch (error) {
            onShowMessage('error', '파일을 읽는 중 오류가 발생했습니다.');
            console.error('Import error:', error);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleTextImport = () => {
        if (!importText.trim()) {
            onShowMessage('error', '가져올 텍스트를 입력해주세요.');
            return;
        }

        const result = onImportEvent(importText);
        onShowMessage(result.success ? 'success' : 'error', result.message);

        if (result.success) {
            setImportText('');
            setShowTextImport(false);
            if (result.eventId) {
                onEventImported(result.eventId);
            }
        }
    };

    return (
        <div className="border-border/60 bg-muted/30 dark:border-border/40 dark:bg-muted/20 space-y-4 rounded-lg border p-4">
            <div>
                <h3 className="text-foreground text-base font-semibold">
                    커스텀 이벤트 가져오기
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                    기존에 내보낸 이벤트 파일을 가져올 수 있습니다
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button onClick={handleImportClick} variant="outline" size="sm">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    파일에서 가져오기
                </Button>
                <Button
                    onClick={() => setShowTextImport(!showTextImport)}
                    variant="outline"
                    size="sm"
                >
                    <FileText className="mr-2 h-4 w-4" />
                    텍스트로 가져오기
                </Button>
            </div>

            {showTextImport && (
                <div className="border-border/60 dark:border-border/40 space-y-3 border-t pt-3">
                    <Label className="text-muted-foreground text-sm">
                        이벤트 데이터 JSON을 붙여넣으세요:
                    </Label>
                    <Textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="커스텀 이벤트 JSON 데이터를 여기에 붙여넣으세요..."
                        rows={4}
                        className="font-mono text-xs"
                    />
                    <div className="flex gap-2">
                        <Button
                            onClick={handleTextImport}
                            size="sm"
                            disabled={!importText.trim()}
                        >
                            가져오기
                        </Button>
                        <Button
                            onClick={() => {
                                setShowTextImport(false);
                                setImportText('');
                            }}
                            variant="outline"
                            size="sm"
                        >
                            취소
                        </Button>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
            />
        </div>
    );
};
