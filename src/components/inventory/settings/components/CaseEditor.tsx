import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaseOption } from '@/types/inventory-management/inventory';

interface CaseEditorProps {
    eventId: string;
    caseOptions: CaseOption[];
    onAddCase: (eventId: string) => void;
    onRemoveCase: (eventId: string, caseIndex: number) => void;
    onUpdateCase: (
        eventId: string,
        caseIndex: number,
        field: keyof CaseOption,
        value: string
    ) => void;
    onAddObject: (eventId: string, caseIndex: number) => void;
    onRemoveObject: (
        eventId: string,
        caseIndex: number,
        objectIndex: number
    ) => void;
    onUpdateObject: (
        eventId: string,
        caseIndex: number,
        objectIndex: number,
        field: string,
        value: number
    ) => void;
}

export const CaseEditor: React.FC<CaseEditorProps> = ({
    eventId,
    caseOptions,
    onAddCase,
    onRemoveCase,
    onUpdateCase,
    onAddObject,
    onRemoveObject,
    onUpdateObject,
}) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">회차 관리</Label>
                <Button onClick={() => onAddCase(eventId)} size="sm">
                    회차 추가
                </Button>
            </div>

            {caseOptions.map((caseOption, caseIndex) => (
                <div
                    key={caseIndex}
                    className="bg-background space-y-3 rounded-lg border p-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <Label className="text-xs font-medium">
                                회차 이름
                            </Label>
                            <Input
                                value={caseOption.label}
                                onChange={(e) =>
                                    onUpdateCase(
                                        eventId,
                                        caseIndex,
                                        'label',
                                        e.target.value
                                    )
                                }
                                className="mt-1 text-sm"
                            />
                        </div>
                        <Button
                            onClick={() => onRemoveCase(eventId, caseIndex)}
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
                                물건 목록
                            </Label>
                            <Button
                                onClick={() => onAddObject(eventId, caseIndex)}
                                size="sm"
                                variant="outline"
                            >
                                물건 추가
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {caseOption.objects.map((obj, objIndex) => (
                                <div
                                    key={objIndex}
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
                                                value={obj.w}
                                                onChange={(e) =>
                                                    onUpdateObject(
                                                        eventId,
                                                        caseIndex,
                                                        objIndex,
                                                        'w',
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1
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
                                                value={obj.h}
                                                onChange={(e) =>
                                                    onUpdateObject(
                                                        eventId,
                                                        caseIndex,
                                                        objIndex,
                                                        'h',
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1
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
                                                value={obj.count}
                                                onChange={(e) =>
                                                    onUpdateObject(
                                                        eventId,
                                                        caseIndex,
                                                        objIndex,
                                                        'count',
                                                        parseInt(
                                                            e.target.value
                                                        ) || 0
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
                                                value={obj.totalCount}
                                                onChange={(e) =>
                                                    onUpdateObject(
                                                        eventId,
                                                        caseIndex,
                                                        objIndex,
                                                        'totalCount',
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1
                                                    )
                                                }
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() =>
                                            onRemoveObject(
                                                eventId,
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
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
