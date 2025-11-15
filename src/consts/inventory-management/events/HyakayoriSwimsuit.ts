import { EventData } from '@/types/inventory-management/inventory';

export const hyakayoriSwimsuitEvent: EventData = {
    id: 'hyakayori-swimsuit-nagusaki',
    name: '백에서 나오는 한송이의 -자 정정당당하게, 수상 승부!-',
    description: '숨겨진 물건들을 찾아보세요!',
    startDate: '2025-11-18 04:00',
    endDate: '2025-12-2 04:00',
    caseOptions: [
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
    ],
};
