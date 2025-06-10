import React, { useState, useRef } from 'react';
import { CaseOption } from '../types/calculator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseOptions: CaseOption[];
  // Hook functions
  exportCaseOptions: () => string;
  importCaseOptions: (jsonString: string) => { success: boolean; message: string };
  downloadFile: (content: string, filename: string) => void;
  addCase: () => void;
  removeCase: (index: number) => void;
  updateCase: (index: number, field: keyof CaseOption, value: string) => void;  addObjectToCase: (caseIndex: number) => void;
  removeObjectFromCase: (caseIndex: number, objectIndex: number) => void;
  updateObjectInCase: (caseIndex: number, objectIndex: number, field: string, value: number) => void;
  resetCaseOptions: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  caseOptions,
  exportCaseOptions,
  importCaseOptions,
  downloadFile,
  addCase,
  removeCase,
  updateCase,  addObjectToCase,
  removeObjectFromCase,
  updateObjectInCase,
  resetCaseOptions,
}) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importText, setImportText] = useState<string>('');
  const [showTextImport, setShowTextImport] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearMessage = () => {
    setMessage(null);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(clearMessage, 3000);
  };

  const handleExport = () => {
    try {
      const exportData = exportCaseOptions();
      const filename = `calculator-cases-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(exportData, filename);
      showMessage('success', '설정이 성공적으로 내보내졌습니다!');
    } catch (error) {
      console.error('Export failed:', error);
      showMessage('error', '내보내기에 실패했습니다.');
    }
  };

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
      
      const result = importCaseOptions(content);
      showMessage(result.success ? 'success' : 'error', result.message);
    } catch (error) {
      showMessage('error', '파일을 읽는 중 오류가 발생했습니다.');
      console.error('Import error:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextImport = () => {
    if (!importText.trim()) {
      showMessage('error', '가져올 텍스트를 입력해주세요.');
      return;
    }

    const result = importCaseOptions(importText);
    showMessage(result.success ? 'success' : 'error', result.message);
    
    if (result.success) {
      setImportText('');
      setShowTextImport(false);
    }
  };
  const handleExportToClipboard = async () => {
    try {
      const exportData = exportCaseOptions();
      await navigator.clipboard.writeText(exportData);
      showMessage('success', '케이스 설정이 클립보드에 복사되었습니다!');
    } catch (error) {
      // Fallback if clipboard API is not available
      showMessage('error', '클립보드 복사에 실패했습니다. 파일 다운로드를 이용해주세요.');
      console.error('Clipboard error:', error);
    }
  };

  const handleResetCaseOptions = () => {
    if (confirm('모든 회차 설정을 기본값으로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      resetCaseOptions();
      showMessage('success', '회차 설정이 기본값으로 초기화되었습니다!');
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
          <DialogDescription>
            회차 설정을 편집하고 데이터를 가져오기/내보내기할 수 있습니다.
          </DialogDescription>
        </DialogHeader>        <div className="space-y-6">          {/* Import/Export Section */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">케이스 설정 공유</Label>
            
            {/* All Options in One Row */}
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              <Button onClick={handleExport} variant="outline" size="sm">
                파일로 내보내기
              </Button>
              <Button onClick={handleExportToClipboard} variant="outline" size="sm">
                클립보드에 복사
              </Button>
              <Button onClick={handleImportClick} variant="outline" size="sm">
                파일에서 가져오기
              </Button>
              <Button 
                onClick={() => setShowTextImport(!showTextImport)} 
                variant="outline" 
                size="sm"
              >
                텍스트로 가져오기
              </Button>
                <Button onClick={handleResetCaseOptions} variant="destructive" size="sm">
                  기본값으로 초기화
                </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>

            {/* Text Import Area */}
            {showTextImport && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <Label className="text-sm font-medium">케이스 설정 JSON을 붙여넣으세요:</Label>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="케이스 설정 JSON을 여기에 붙여넣으세요..."
                  rows={4}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleTextImport} size="sm">
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
          </div>

          {message && (
            <div className={`p-3 border rounded text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Cases Editor */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">회차 설정</Label>
              <Button onClick={addCase} size="sm">
                회차 추가
              </Button>
            </div>

            {caseOptions.map((caseOption, caseIndex) => (
              <div key={caseIndex} className="border rounded-lg p-4 space-y-3">                
                <div className="flex flex-col gap-2">
                  <div className="flex items-end">
                    <Label htmlFor={`case-label-${caseIndex}`} className="text-sm font-medium flex-1">회차 이름</Label>
                    <Button
                      onClick={() => removeCase(caseIndex)}
                      size="sm"
                      variant="destructive"
                      className="ml-4"
                    >
                      제거
                    </Button>
                  </div>
                  <Input
                    id={`case-label-${caseIndex}`}
                    value={caseOption.label}
                    onChange={(e) => updateCase(caseIndex, 'label', e.target.value)}
                    className="mt-1"
                    placeholder="회차 이름을 입력하세요"
                  />
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-sm font-medium">물건 목록</Label>
                    <Button
                      onClick={() => addObjectToCase(caseIndex)}
                      size="sm"
                      variant="outline"
                    >
                      + 물건 추가
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {caseOption.objects.map((obj, objIndex) => (
                      <div key={objIndex} className="flex gap-3 items-end p-3 bg-muted rounded-lg">
                        <div className="grid grid-cols-4 gap-3 flex-1">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">너비</Label>
                            <Input
                              type="number"
                              min="1"
                              value={obj.w}
                              onChange={(e) => updateObjectInCase(caseIndex, objIndex, 'w', parseInt(e.target.value) || 1)}
                              className="h-9 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">높이</Label>
                            <Input
                              type="number"
                              min="1"
                              value={obj.h}
                              onChange={(e) => updateObjectInCase(caseIndex, objIndex, 'h', parseInt(e.target.value) || 1)}
                              className="h-9 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">현재 개수</Label>
                            <Input
                              type="number"
                              min="0"
                              value={obj.count}
                              onChange={(e) => updateObjectInCase(caseIndex, objIndex, 'count', parseInt(e.target.value) || 0)}
                              className="h-9 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">총 개수</Label>
                            <Input
                              type="number"
                              min="1"
                              value={obj.totalCount}
                              onChange={(e) => updateObjectInCase(caseIndex, objIndex, 'totalCount', parseInt(e.target.value) || 1)}
                              className="h-9 mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => removeObjectFromCase(caseIndex, objIndex)}
                          size="sm"
                          variant="destructive"
                          className="h-9 px-3"
                        >
                          삭제
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
