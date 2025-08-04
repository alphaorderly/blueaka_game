import React, { useState, useRef } from 'react';
import { EventData, CaseOption } from '../types/calculator';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    customEvents: EventData[];
    selectedEvent: string;
    // Custom Event Management
    createCustomEvent: (name: string, description?: string) => EventData;
    updateCustomEvent: (eventId: string, updates: Partial<EventData>) => void;
    deleteCustomEvent: (eventId: string) => void;
    setSelectedEvent: (eventId: string) => void;
    // Import/Export
    exportCustomEvent: (eventId: string) => string;
    importCustomEvent: (jsonString: string) => {
        success: boolean;
        message: string;
        eventId?: string;
    };
    downloadFile: (content: string, filename: string) => void;
    // Case/Object Management for Custom Events
    addCaseToCustomEvent: (eventId: string) => void;
    removeCaseFromCustomEvent: (eventId: string, caseIndex: number) => void;
    updateCaseInCustomEvent: (
        eventId: string,
        caseIndex: number,
        field: keyof CaseOption,
        value: string
    ) => void;
    addObjectToCustomEventCase: (eventId: string, caseIndex: number) => void;
    removeObjectFromCustomEventCase: (
        eventId: string,
        caseIndex: number,
        objectIndex: number
    ) => void;
    updateObjectInCustomEventCase: (
        eventId: string,
        caseIndex: number,
        objectIndex: number,
        field: string,
        value: number
    ) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    customEvents,
    selectedEvent,
    createCustomEvent,
    updateCustomEvent,
    deleteCustomEvent,
    setSelectedEvent,
    exportCustomEvent,
    importCustomEvent,
    downloadFile,
    addCaseToCustomEvent,
    removeCaseFromCustomEvent,
    updateCaseInCustomEvent,
    addObjectToCustomEventCase,
    removeObjectFromCustomEventCase,
    updateObjectInCustomEventCase,
}) => {
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [importText, setImportText] = useState<string>('');
    const [showTextImport, setShowTextImport] = useState<boolean>(false);
    const [newEventName, setNewEventName] = useState<string>('');
    const [newEventDescription, setNewEventDescription] = useState<string>('');
    const [selectedCustomEventId, setSelectedCustomEventId] =
        useState<string>('');
    const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 커스텀 이벤트가 있을 때 첫 번째 이벤트를 자동 선택
    React.useEffect(() => {
        if (customEvents.length > 0 && !selectedCustomEventId) {
            setSelectedCustomEventId(customEvents[0].id);
        }
    }, [customEvents, selectedCustomEventId]);

    const clearMessage = () => {
        setMessage(null);
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(clearMessage, 5000);
    };

    const handleCreateEvent = () => {
        if (!newEventName.trim()) {
            showMessage('error', '이벤트 이름을 입력해주세요.');
            return;
        }

        try {
            const newEvent = createCustomEvent(
                newEventName.trim(),
                newEventDescription.trim() || undefined
            );
            setNewEventName('');
            setNewEventDescription('');
            setSelectedCustomEventId(newEvent.id);
            showMessage(
                'success',
                `커스텀 이벤트 "${newEvent.name}"가 생성되었습니다!`
            );
        } catch {
            showMessage('error', '이벤트 생성에 실패했습니다.');
        }
    };

    const handleEditEvent = (eventId: string) => {
        const event = customEvents.find((e) => e.id === eventId);
        if (event) {
            setEditingEvent({ ...event });
        }
    };

    const handleSaveEditEvent = () => {
        if (!editingEvent) return;

        if (!editingEvent.name.trim()) {
            showMessage('error', '이벤트 이름을 입력해주세요.');
            return;
        }

        updateCustomEvent(editingEvent.id, {
            name: editingEvent.name.trim(),
            description: editingEvent.description?.trim() || undefined,
        });

        setEditingEvent(null);
        showMessage('success', '이벤트 정보가 업데이트되었습니다!');
    };

    const handleDeleteEvent = (eventId: string) => {
        const event = customEvents.find((e) => e.id === eventId);
        if (!event) return;

        if (
            confirm(
                `커스텀 이벤트 "${event.name}"를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            )
        ) {
            deleteCustomEvent(eventId);

            // 삭제된 이벤트가 현재 선택된 이벤트라면 다른 이벤트 선택
            if (selectedCustomEventId === eventId) {
                const remainingEvents = customEvents.filter(
                    (e) => e.id !== eventId
                );
                if (remainingEvents.length > 0) {
                    setSelectedCustomEventId(remainingEvents[0].id);
                } else {
                    setSelectedCustomEventId('');
                }
            }

            showMessage(
                'success',
                `커스텀 이벤트 "${event.name}"가 삭제되었습니다.`
            );
        }
    };

    const handleExportEvent = (eventId: string) => {
        try {
            const exportData = exportCustomEvent(eventId);
            const event = customEvents.find((e) => e.id === eventId);
            const filename = `custom-event-${event?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
            downloadFile(exportData, filename);
            showMessage(
                'success',
                '커스텀 이벤트가 성공적으로 내보내졌습니다!'
            );
        } catch (error) {
            console.error('Export failed:', error);
            showMessage('error', '내보내기에 실패했습니다.');
        }
    };

    const handleExportToClipboard = async (eventId: string) => {
        try {
            const exportData = exportCustomEvent(eventId);
            await navigator.clipboard.writeText(exportData);
            showMessage(
                'success',
                '커스텀 이벤트 데이터가 클립보드에 복사되었습니다!'
            );
        } catch (error) {
            showMessage(
                'error',
                '클립보드 복사에 실패했습니다. 파일 다운로드를 이용해주세요.'
            );
            console.error('Clipboard error:', error);
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

            const result = importCustomEvent(content);
            showMessage(result.success ? 'success' : 'error', result.message);

            if (result.success && result.eventId) {
                setSelectedCustomEventId(result.eventId);
            }
        } catch (error) {
            showMessage('error', '파일을 읽는 중 오류가 발생했습니다.');
            console.error('Import error:', error);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleTextImport = () => {
        if (!importText.trim()) {
            showMessage('error', '가져올 텍스트를 입력해주세요.');
            return;
        }

        const result = importCustomEvent(importText);
        showMessage(result.success ? 'success' : 'error', result.message);

        if (result.success) {
            setImportText('');
            setShowTextImport(false);
            if (result.eventId) {
                setSelectedCustomEventId(result.eventId);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[85vh] w-[95vw] max-w-5xl overflow-y-auto sm:w-full">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                        커스텀 이벤트 관리
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        커스텀 이벤트를 생성, 편집, 공유할 수 있습니다. 기본
                        이벤트는 수정할 수 없습니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Message Display */}
                    {message && (
                        <div
                            className={`rounded border p-3 text-sm ${
                                message.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-800'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Create New Event */}
                    <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                        <Label className="text-base font-semibold">
                            새 커스텀 이벤트 만들기
                        </Label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <Label
                                    htmlFor="event-name"
                                    className="text-sm font-medium"
                                >
                                    이벤트 이름 *
                                </Label>
                                <Input
                                    id="event-name"
                                    value={newEventName}
                                    onChange={(e) =>
                                        setNewEventName(e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setNewEventDescription(e.target.value)
                                    }
                                    placeholder="이벤트 설명을 입력하세요"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleCreateEvent}
                            className="w-full sm:w-auto"
                        >
                            커스텀 이벤트 생성
                        </Button>
                    </div>

                    {/* Import Section */}
                    <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                        <Label className="text-base font-semibold">
                            커스텀 이벤트 가져오기
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={handleImportClick}
                                variant="outline"
                                size="sm"
                            >
                                📂 파일에서 가져오기
                            </Button>
                            <Button
                                onClick={() =>
                                    setShowTextImport(!showTextImport)
                                }
                                variant="outline"
                                size="sm"
                            >
                                📝 텍스트로 가져오기
                            </Button>
                        </div>

                        {showTextImport && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    이벤트 데이터 JSON을 붙여넣으세요:
                                </Label>
                                <Textarea
                                    value={importText}
                                    onChange={(e) =>
                                        setImportText(e.target.value)
                                    }
                                    placeholder="커스텀 이벤트 JSON 데이터를 여기에 붙여넣으세요..."
                                    rows={4}
                                    className="font-mono text-xs"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleTextImport}
                                        size="sm"
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

                    {/* Custom Events List */}
                    {customEvents.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex flex-col gap-3">
                                <Label className="text-base font-semibold">
                                    내 커스텀 이벤트 ({customEvents.length}개)
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium">
                                        편집할 이벤트:
                                    </Label>
                                    <Select
                                        value={selectedCustomEventId}
                                        onValueChange={setSelectedCustomEventId}
                                    >
                                        <SelectTrigger className="w-[250px]">
                                            <SelectValue placeholder="이벤트 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customEvents.map((event) => (
                                                <SelectItem
                                                    key={event.id}
                                                    value={event.id}
                                                >
                                                    {event.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* 선택된 이벤트만 표시 */}
                            {selectedCustomEventId &&
                                (() => {
                                    const currentEvent = customEvents.find(
                                        (e) => e.id === selectedCustomEventId
                                    );
                                    if (!currentEvent) return null;

                                    return (
                                        <div className="space-y-3 rounded-lg border p-4">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex-1">
                                                    <h4 className="text-base font-medium">
                                                        {currentEvent.name}
                                                    </h4>
                                                    {currentEvent.description && (
                                                        <p className="text-muted-foreground mt-1 text-sm">
                                                            {
                                                                currentEvent.description
                                                            }
                                                        </p>
                                                    )}
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        {
                                                            currentEvent
                                                                .caseOptions
                                                                .length
                                                        }
                                                        개 회차 | 총{' '}
                                                        {currentEvent.caseOptions.reduce(
                                                            (sum, c) =>
                                                                sum +
                                                                c.objects
                                                                    .length,
                                                            0
                                                        )}
                                                        개 물건 타입
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        onClick={() =>
                                                            setSelectedEvent(
                                                                currentEvent.id
                                                            )
                                                        }
                                                        variant={
                                                            selectedEvent ===
                                                            currentEvent.id
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        size="sm"
                                                    >
                                                        {selectedEvent ===
                                                        currentEvent.id
                                                            ? '현재 선택됨'
                                                            : '사용하기'}
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            handleExportEvent(
                                                                currentEvent.id
                                                            )
                                                        }
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        📁 내보내기
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            handleExportToClipboard(
                                                                currentEvent.id
                                                            )
                                                        }
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        📋 복사
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            handleDeleteEvent(
                                                                currentEvent.id
                                                            )
                                                        }
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        삭제
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Event Editor - 항상 펼쳐진 상태 */}
                                            <div className="mt-4 space-y-4 border-t pt-4">
                                                {/* Edit Event Info */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-semibold">
                                                            이벤트 정보 편집
                                                        </Label>
                                                        <Button
                                                            onClick={() =>
                                                                handleEditEvent(
                                                                    currentEvent.id
                                                                )
                                                            }
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            편집
                                                        </Button>
                                                    </div>

                                                    {editingEvent?.id ===
                                                        currentEvent.id && (
                                                        <div className="bg-muted space-y-3 rounded-lg p-3">
                                                            <div>
                                                                <Label className="text-sm">
                                                                    이벤트 이름
                                                                </Label>
                                                                <Input
                                                                    value={
                                                                        editingEvent.name
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setEditingEvent(
                                                                            {
                                                                                ...editingEvent,
                                                                                name: e
                                                                                    .target
                                                                                    .value,
                                                                            }
                                                                        )
                                                                    }
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm">
                                                                    설명
                                                                </Label>
                                                                <Input
                                                                    value={
                                                                        editingEvent.description ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setEditingEvent(
                                                                            {
                                                                                ...editingEvent,
                                                                                description:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            }
                                                                        )
                                                                    }
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={
                                                                        handleSaveEditEvent
                                                                    }
                                                                    size="sm"
                                                                >
                                                                    저장
                                                                </Button>
                                                                <Button
                                                                    onClick={() =>
                                                                        setEditingEvent(
                                                                            null
                                                                        )
                                                                    }
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    취소
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Cases Editor */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-semibold">
                                                            회차 관리
                                                        </Label>
                                                        <Button
                                                            onClick={() =>
                                                                addCaseToCustomEvent(
                                                                    currentEvent.id
                                                                )
                                                            }
                                                            size="sm"
                                                        >
                                                            회차 추가
                                                        </Button>
                                                    </div>

                                                    {currentEvent.caseOptions.map(
                                                        (
                                                            caseOption,
                                                            caseIndex
                                                        ) => (
                                                            <div
                                                                key={caseIndex}
                                                                className="bg-background space-y-3 rounded-lg border p-3"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <Label className="text-xs font-medium">
                                                                            회차
                                                                            이름
                                                                        </Label>
                                                                        <Input
                                                                            value={
                                                                                caseOption.label
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateCaseInCustomEvent(
                                                                                    currentEvent.id,
                                                                                    caseIndex,
                                                                                    'label',
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="mt-1 text-sm"
                                                                        />
                                                                    </div>
                                                                    <Button
                                                                        onClick={() =>
                                                                            removeCaseFromCustomEvent(
                                                                                currentEvent.id,
                                                                                caseIndex
                                                                            )
                                                                        }
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="ml-3"
                                                                    >
                                                                        제거
                                                                    </Button>
                                                                </div>

                                                                <div>
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <Label className="text-xs font-medium">
                                                                            물건
                                                                            목록
                                                                        </Label>
                                                                        <Button
                                                                            onClick={() =>
                                                                                addObjectToCustomEventCase(
                                                                                    currentEvent.id,
                                                                                    caseIndex
                                                                                )
                                                                            }
                                                                            size="sm"
                                                                            variant="outline"
                                                                        >
                                                                            물건
                                                                            추가
                                                                        </Button>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        {caseOption.objects.map(
                                                                            (
                                                                                obj,
                                                                                objIndex
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        objIndex
                                                                                    }
                                                                                    className="bg-muted flex items-end gap-2 rounded p-2"
                                                                                >
                                                                                    <div className="grid flex-1 grid-cols-4 gap-2">
                                                                                        <div>
                                                                                            <Label className="text-xs">
                                                                                                너비
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="1"
                                                                                                value={
                                                                                                    obj.w
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    updateObjectInCustomEventCase(
                                                                                                        currentEvent.id,
                                                                                                        caseIndex,
                                                                                                        objIndex,
                                                                                                        'w',
                                                                                                        parseInt(
                                                                                                            e
                                                                                                                .target
                                                                                                                .value
                                                                                                        ) ||
                                                                                                            1
                                                                                                    )
                                                                                                }
                                                                                                className="h-8 text-xs"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-xs">
                                                                                                높이
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="1"
                                                                                                value={
                                                                                                    obj.h
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    updateObjectInCustomEventCase(
                                                                                                        currentEvent.id,
                                                                                                        caseIndex,
                                                                                                        objIndex,
                                                                                                        'h',
                                                                                                        parseInt(
                                                                                                            e
                                                                                                                .target
                                                                                                                .value
                                                                                                        ) ||
                                                                                                            1
                                                                                                    )
                                                                                                }
                                                                                                className="h-8 text-xs"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-xs">
                                                                                                현재
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                value={
                                                                                                    obj.count
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    updateObjectInCustomEventCase(
                                                                                                        currentEvent.id,
                                                                                                        caseIndex,
                                                                                                        objIndex,
                                                                                                        'count',
                                                                                                        parseInt(
                                                                                                            e
                                                                                                                .target
                                                                                                                .value
                                                                                                        ) ||
                                                                                                            0
                                                                                                    )
                                                                                                }
                                                                                                className="h-8 text-xs"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-xs">
                                                                                                총계
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="1"
                                                                                                value={
                                                                                                    obj.totalCount
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    updateObjectInCustomEventCase(
                                                                                                        currentEvent.id,
                                                                                                        caseIndex,
                                                                                                        objIndex,
                                                                                                        'totalCount',
                                                                                                        parseInt(
                                                                                                            e
                                                                                                                .target
                                                                                                                .value
                                                                                                        ) ||
                                                                                                            1
                                                                                                    )
                                                                                                }
                                                                                                className="h-8 text-xs"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <Button
                                                                                        onClick={() =>
                                                                                            removeObjectFromCustomEventCase(
                                                                                                currentEvent.id,
                                                                                                caseIndex,
                                                                                                objIndex
                                                                                            )
                                                                                        }
                                                                                        size="sm"
                                                                                        variant="destructive"
                                                                                        className="h-8 px-2"
                                                                                    >
                                                                                        삭제
                                                                                    </Button>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                        </div>
                    )}

                    {customEvents.length === 0 && (
                        <div className="text-muted-foreground py-8 text-center">
                            <p>아직 커스텀 이벤트가 없습니다.</p>
                            <p className="text-sm">
                                위에서 새 이벤트를 만들거나 기존 이벤트를
                                가져와보세요.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto"
                    >
                        닫기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsModal;
