export const GRID_WIDTH = 9;
export const GRID_HEIGHT = 5;

// 기존 호환성을 위해 유지하지만, 새로운 이벤트 시스템 사용을 권장합니다.
// 이 상수들은 향후 버전에서 제거될 예정입니다.
export {
    AVAILABLE_EVENTS,
    DEFAULT_EVENT_ID,
    getEventById,
    getDefaultEvent,
} from './events';
