import { CaseOption } from '../types/calculator';

export const GRID_WIDTH = 9;
export const GRID_HEIGHT = 5;

export const CASE_OPTIONS: CaseOption[] = [
  {
    value: 'case1',
    label: '1, 4 회차',
    objects: [
      { w: 3, h: 2, count: 2, totalCount: 2 },
      { w: 3, h: 1, count: 5, totalCount: 5 },
      { w: 2, h: 1, count: 2, totalCount: 2 },
    ],
  },
  {
    value: 'case2',
    label: '2, 5 회차',
    objects: [
      { w: 4, h: 2, count: 1, totalCount: 1 },
      { w: 1, h: 4, count: 2, totalCount: 2 },
      { w: 3, h: 1, count: 5, totalCount: 5 },
    ],
  },
  {
    value: 'case3',
    label: '3, 6 회차',
    objects: [
      { w: 3, h: 3, count: 1, totalCount: 1 },
      { w: 2, h: 2, count: 4, totalCount: 4 },
      { w: 2, h: 1, count: 3, totalCount: 3 },
    ],
  },
  {
    value: 'case4',
    label: '7 회차 이상',
    objects: [
      { w: 4, h: 2, count: 2, totalCount: 2 },
      { w: 3, h: 1, count: 3, totalCount: 3 },
      { w: 2, h: 1, count: 6, totalCount: 6 },
    ],
  },
];
