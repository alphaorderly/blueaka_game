export interface GameObject {
  w: number;
  h: number;
  count: number;
  totalCount: number;
}

export interface CaseOption {
  value: string;
  label: string;
  objects: GameObject[];
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
}

export type PlacementMode = 'none' | 'placing' | 'opened';
