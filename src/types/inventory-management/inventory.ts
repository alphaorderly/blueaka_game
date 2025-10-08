export interface InventoryObject {
    w: number;
    h: number;
    count: number;
    totalCount: number;
}

export interface CaseOption {
    value: string;
    label: string;
    objects: InventoryObject[];
}

export interface EventData {
    id: string;
    name: string;
    description?: string;
    /** KST-based datetime string, e.g., "YYYY-MM-DD HH:mm" */
    startDate?: string | null;
    /** KST-based datetime string, e.g., "YYYY-MM-DD HH:mm" */
    endDate?: string | null;
    caseOptions: CaseOption[];
}

export interface GridPosition {
    x: number;
    y: number;
}

export interface ProbabilityCell {
    x: number;
    y: number;
    prob: number;
}

export interface Orientation {
    w: number;
    h: number;
}

export interface Placement {
    cells: [number, number][];
}

export interface PlacedObject {
    id: string;
    objectIndex: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
    cells: GridPosition[];
    isRotated?: boolean;
}

export type PlacementMode = 'none' | 'placing' | 'opened';
