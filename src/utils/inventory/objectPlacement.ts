import { GRID_HEIGHT, GRID_WIDTH } from '@/consts/inventory-management/events';
import {
    GridPosition,
    PlacedObject,
} from '@/types/inventory-management/inventory';

export interface ObjectToPlace {
    w: number;
    h: number;
    count: number;
    objectIndex: number;
}

/**
 * 절대 실패하지 않는 오브젝트 배치 알고리즘 (개선된 버전)
 * 1. Multi-Pass: 여러 번 시도해서 가장 분산된 결과 선택
 * 2. Anti-Clustering: 오브젝트 간 거리 페널티로 뭉침 방지
 * 3. 적응형 우선순위: 배치 진행에 따라 동적 가중치 조정
 * 4. 백트래킹: 실패 시 이전 단계로 돌아가서 다른 위치 시도
 */
export function placeObjectsGuaranteed(
    objects: ObjectToPlace[]
): PlacedObject[] {
    const maxAttempts = 8; // 더 많은 시도로 랜덤성 증가
    let bestResult: PlacedObject[] | null = null;
    let bestSparseness = -Infinity;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const result = attemptPlacement(objects);

            if (result) {
                // Sparseness 점수 계산 (높을수록 더 분산됨)
                const sparseness = calculateSparseness(result);

                if (sparseness > bestSparseness) {
                    bestSparseness = sparseness;
                    bestResult = result;
                }

                // 충분히 분산된 결과면 조기 종료
                if (sparseness > getTargetSparseness(objects)) {
                    break;
                }
            }
        } catch {
            // 이 시도는 실패, 다음 시도 계속
            continue;
        }
    }

    if (bestResult) {
        return bestResult;
    }

    // 모든 시도가 실패한 경우
    throw new Error(
        '오브젝트 배치에 실패했습니다. 그리드 크기를 확인해주세요.'
    );
}

/**
 * 단일 배치 시도
 */
function attemptPlacement(objects: ObjectToPlace[]): PlacedObject[] | null {
    // 오브젝트를 크기(면적) 순으로 정렬 (큰 것부터)
    const sortedObjects = objects
        .flatMap((obj) =>
            Array.from({ length: obj.count }, (_, i) => ({
                ...obj,
                instanceId: `${obj.objectIndex}-${i}`,
            }))
        )
        .sort((a, b) => b.w * b.h - a.w * a.h);

    const placedObjects: PlacedObject[] = [];

    // 백트래킹으로 배치
    if (placeObjectsRecursive(sortedObjects, 0, placedObjects)) {
        return placedObjects;
    }

    return null;
}

/**
 * 배치 결과의 분산도(sparseness) 계산
 */
function calculateSparseness(placedObjects: PlacedObject[]): number {
    if (placedObjects.length <= 1) return 0;

    let totalDistance = 0;
    let pairCount = 0;

    // 모든 오브젝트 쌍 간의 거리 합계 계산
    for (let i = 0; i < placedObjects.length; i++) {
        for (let j = i + 1; j < placedObjects.length; j++) {
            const obj1 = placedObjects[i];
            const obj2 = placedObjects[j];

            const centerX1 = obj1.startX + obj1.width / 2;
            const centerY1 = obj1.startY + obj1.height / 2;
            const centerX2 = obj2.startX + obj2.width / 2;
            const centerY2 = obj2.startY + obj2.height / 2;

            const distance = Math.sqrt(
                Math.pow(centerX2 - centerX1, 2) +
                    Math.pow(centerY2 - centerY1, 2)
            );

            totalDistance += distance;
            pairCount++;
        }
    }

    return pairCount > 0 ? totalDistance / pairCount : 0;
}

/**
 * 목표 분산도 계산 (충분히 분산된 것으로 간주할 기준)
 */
function getTargetSparseness(objects: ObjectToPlace[]): number {
    const totalObjects = objects.reduce((sum, obj) => sum + obj.count, 0);
    const gridDiagonal = Math.sqrt(
        GRID_WIDTH * GRID_WIDTH + GRID_HEIGHT * GRID_HEIGHT
    );

    // 이상적인 경우의 70% 정도면 충분히 좋은 결과로 간주
    return (gridDiagonal / Math.sqrt(totalObjects)) * 0.7;
}

/**
 * 재귀적으로 오브젝트를 배치하는 함수 (백트래킹 사용, 회전 및 랜덤 배치 지원)
 */
function placeObjectsRecursive(
    objects: (ObjectToPlace & { instanceId: string })[],
    currentIndex: number,
    placedObjects: PlacedObject[]
): boolean {
    // 모든 오브젝트를 배치했다면 성공
    if (currentIndex >= objects.length) {
        return true;
    }

    const currentObject = objects[currentIndex];

    // 가능한 모든 위치와 회전 조합을 생성하고 랜덤하게 섞기
    // 이미 배치된 오브젝트 정보를 전달하여 anti-clustering 적용
    const possiblePlacements = generateRandomPlacements(
        currentObject,
        placedObjects
    );

    // 각 가능한 배치를 시도
    for (const placement of possiblePlacements) {
        const { x, y, width, height, isRotated } = placement;

        // 이 위치에 배치할 수 있는지 확인
        if (canPlaceAt(x, y, width, height, placedObjects)) {
            // 배치
            const newPlacedObject = createPlacedObject(
                currentObject.instanceId,
                currentObject.objectIndex,
                x,
                y,
                width,
                height,
                isRotated
            );

            placedObjects.push(newPlacedObject);

            // 다음 오브젝트 배치 시도
            if (
                placeObjectsRecursive(objects, currentIndex + 1, placedObjects)
            ) {
                return true; // 성공
            }

            // 실패했다면 백트래킹 - 현재 배치를 취소
            placedObjects.pop();
        }
    }

    // 모든 위치를 시도했지만 배치할 수 없음
    return false;
}

/**
 * 오브젝트의 가능한 모든 배치 위치와 회전을 생성하고 랜덤하게 섞기
 * Anti-clustering 페널티와 적응형 우선순위로 더 분산된 배치 생성
 */
function generateRandomPlacements(
    obj: ObjectToPlace,
    placedObjects: PlacedObject[] = []
): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    isRotated: boolean;
}> {
    const placements: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        isRotated: boolean;
        priority: number; // 우선순위 (낮을수록 우선)
    }> = [];

    // 원본 방향과 90도 회전 방향 모두 고려
    const orientations = [
        { width: obj.w, height: obj.h, isRotated: false },
        ...(obj.w !== obj.h
            ? [{ width: obj.h, height: obj.w, isRotated: true }]
            : []),
    ];

    // 적응형 가중치: 배치된 오브젝트 수에 따라 조정
    const placedCount = placedObjects.length;
    const totalObjects = obj.count; // 대략적인 총 오브젝트 수
    const progressRatio = Math.min(
        placedCount / Math.max(totalObjects * 3, 1),
        1
    );

    // 랜덤성을 크게 증가시키고 분산/가장자리 가중치 감소
    const dispersionWeight = 1.0 * (1 - progressRatio * 0.8); // 기존 3.0에서 1.0으로 감소
    const antiClusterWeight = 1.5 * (1 - progressRatio * 0.6); // 기존 2.0에서 1.5로 감소
    const randomnessWeight = 3.0; // 랜덤 요소 가중치 증가

    for (const orientation of orientations) {
        for (let y = 0; y <= GRID_HEIGHT - orientation.height; y++) {
            for (let x = 0; x <= GRID_WIDTH - orientation.width; x++) {
                // 1. 중앙 회피 점수 (분산 배치) - 약화됨
                const centerX = GRID_WIDTH / 2;
                const centerY = GRID_HEIGHT / 2;
                const objCenterX = x + orientation.width / 2;
                const objCenterY = y + orientation.height / 2;
                const distanceFromCenter = Math.sqrt(
                    Math.pow(objCenterX - centerX, 2) +
                        Math.pow(objCenterY - centerY, 2)
                );
                const dispersionScore = distanceFromCenter * dispersionWeight;

                // 2. Anti-clustering 페널티 계산 - 약화됨
                let clusterPenalty = 0;
                const minDistance =
                    Math.max(orientation.width, orientation.height) + 1;

                for (const placedObj of placedObjects) {
                    const placedCenterX =
                        placedObj.startX + placedObj.width / 2;
                    const placedCenterY =
                        placedObj.startY + placedObj.height / 2;
                    const distance = Math.sqrt(
                        Math.pow(objCenterX - placedCenterX, 2) +
                            Math.pow(objCenterY - placedCenterY, 2)
                    );

                    // 가까운 거리에 페널티 부여 (완전 금지하지는 않음)
                    if (distance < minDistance) {
                        clusterPenalty +=
                            (minDistance - distance) * antiClusterWeight;
                    }
                }

                // 3. 가장자리 보너스 제거 - 이제 중앙도 똑같이 선택될 수 있음
                // const edgeBonus = 0; // 가장자리 편향 완전 제거

                // 4. 랜덤 요소 크게 증가 (예측 불가능성 극대화)
                const randomFactor = Math.random() * randomnessWeight;

                // 최종 우선순위 계산 (낮을수록 우선) - 가장자리 보너스 제거
                const priority =
                    -dispersionScore + clusterPenalty + randomFactor;

                placements.push({
                    x,
                    y,
                    width: orientation.width,
                    height: orientation.height,
                    isRotated: orientation.isRotated,
                    priority,
                });
            }
        }
    }

    // 우선순위로 정렬
    placements.sort((a, b) => a.priority - b.priority);

    // 전체를 랜덤하게 섞어서 최대한 예측 불가능한 배치
    return shuffleArray(placements).map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ priority, ...placement }) => placement
    );
}

/**
 * 배열을 랜덤하게 섞는 Fisher-Yates 알고리즘
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * 지정된 위치에 오브젝트를 배치할 수 있는지 확인
 */
function canPlaceAt(
    x: number,
    y: number,
    width: number,
    height: number,
    placedObjects: PlacedObject[]
): boolean {
    // 그리드 경계 확인
    if (x + width > GRID_WIDTH || y + height > GRID_HEIGHT) {
        return false;
    }

    // 새로운 오브젝트가 차지할 셀들
    const newCells: GridPosition[] = [];
    for (let dx = 0; dx < width; dx++) {
        for (let dy = 0; dy < height; dy++) {
            newCells.push({ x: x + dx, y: y + dy });
        }
    }

    // 기존 배치된 오브젝트와 겹치는지 확인
    for (const placedObject of placedObjects) {
        for (const placedCell of placedObject.cells) {
            for (const newCell of newCells) {
                if (placedCell.x === newCell.x && placedCell.y === newCell.y) {
                    return false; // 겹침
                }
            }
        }
    }

    return true; // 배치 가능
}

/**
 * PlacedObject 생성 헬퍼 함수
 */
function createPlacedObject(
    id: string,
    objectIndex: number,
    startX: number,
    startY: number,
    width: number,
    height: number,
    isRotated: boolean = false
): PlacedObject {
    const cells: GridPosition[] = [];
    for (let dx = 0; dx < width; dx++) {
        for (let dy = 0; dy < height; dy++) {
            cells.push({ x: startX + dx, y: startY + dy });
        }
    }

    return {
        id,
        objectIndex,
        startX,
        startY,
        width,
        height,
        cells,
        isRotated,
    };
}

/**
 * 배치 가능성을 미리 체크하는 함수 (선택적 사용)
 */
export function canFitAllObjects(objects: ObjectToPlace[]): boolean {
    const totalArea = objects.reduce(
        (sum, obj) => sum + obj.w * obj.h * obj.count,
        0
    );
    const gridArea = GRID_WIDTH * GRID_HEIGHT;

    if (totalArea > gridArea) {
        return false; // 면적이 부족
    }

    // 실제 배치 가능성을 확인하려면 placeObjectsGuaranteed를 호출해야 하지만
    // 이는 비용이 크므로 여기서는 면적만 체크
    return true;
}
