export interface ObjectTypeColor {
    hue: number;
    lightBg: string;
    lightText: string;
    darkBg: string;
    darkText: string;
    className: string;
}

// 고정된 오브젝트 색상 팔레트 (1번부터 10번까지)
const PREDEFINED_COLORS: ObjectTypeColor[] = [
    // 오브젝트 1 - 파란색 계열
    {
        hue: 210,
        lightBg: 'hsl(210, 70%, 85%)',
        lightText: 'hsl(210, 70%, 20%)',
        darkBg: 'hsl(210, 60%, 30%)',
        darkText: 'hsl(210, 60%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 2 - 초록색 계열
    {
        hue: 120,
        lightBg: 'hsl(120, 70%, 85%)',
        lightText: 'hsl(120, 70%, 20%)',
        darkBg: 'hsl(120, 60%, 30%)',
        darkText: 'hsl(120, 60%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 3 - 주황색 계열
    {
        hue: 30,
        lightBg: 'hsl(30, 80%, 85%)',
        lightText: 'hsl(30, 80%, 20%)',
        darkBg: 'hsl(30, 70%, 35%)',
        darkText: 'hsl(30, 70%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 4 - 보라색 계열
    {
        hue: 270,
        lightBg: 'hsl(270, 70%, 85%)',
        lightText: 'hsl(270, 70%, 20%)',
        darkBg: 'hsl(270, 60%, 30%)',
        darkText: 'hsl(270, 60%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 5 - 핑크색 계열
    {
        hue: 330,
        lightBg: 'hsl(330, 75%, 85%)',
        lightText: 'hsl(330, 75%, 20%)',
        darkBg: 'hsl(330, 65%, 30%)',
        darkText: 'hsl(330, 65%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 6 - 청록색 계열
    {
        hue: 180,
        lightBg: 'hsl(180, 70%, 85%)',
        lightText: 'hsl(180, 70%, 20%)',
        darkBg: 'hsl(180, 60%, 30%)',
        darkText: 'hsl(180, 60%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 7 - 라임색 계열
    {
        hue: 90,
        lightBg: 'hsl(90, 70%, 85%)',
        lightText: 'hsl(90, 70%, 20%)',
        darkBg: 'hsl(90, 60%, 30%)',
        darkText: 'hsl(90, 60%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 8 - 인디고색 계열
    {
        hue: 240,
        lightBg: 'hsl(240, 70%, 85%)',
        lightText: 'hsl(240, 70%, 20%)',
        darkBg: 'hsl(240, 60%, 30%)',
        darkText: 'hsl(240, 60%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 9 - 로즈색 계열
    {
        hue: 0,
        lightBg: 'hsl(0, 75%, 85%)',
        lightText: 'hsl(0, 75%, 20%)',
        darkBg: 'hsl(0, 65%, 30%)',
        darkText: 'hsl(0, 65%, 85%)',
        className: 'border border-current',
    },
    // 오브젝트 10 - 앰버색 계열
    {
        hue: 45,
        lightBg: 'hsl(45, 80%, 85%)',
        lightText: 'hsl(45, 80%, 20%)',
        darkBg: 'hsl(45, 70%, 35%)',
        darkText: 'hsl(45, 70%, 85%)',
        className: 'border border-current',
    },
];

export const generateColorForObjectType = (
    existingColors: { [objectIndex: number]: ObjectTypeColor },
    objectIndex?: number
): ObjectTypeColor => {
    // 오브젝트 인덱스가 주어지고 미리 정의된 색상 범위 내라면 해당 색상 사용
    if (objectIndex !== undefined && objectIndex < PREDEFINED_COLORS.length) {
        return PREDEFINED_COLORS[objectIndex];
    }

    // 미리 정의된 색상을 모두 사용했거나 인덱스가 없는 경우 기존 랜덤 로직 사용
    const existingHues = Object.values(existingColors)
        .map((color) => {
            if (color && color.hue) return color.hue;
            return -1;
        })
        .filter((hue) => hue >= 0);

    let hue: number;
    let attempts = 0;

    // Try to find a hue that's at least 30 degrees away from existing ones
    do {
        hue = Math.floor(Math.random() * 360);
        attempts++;
    } while (
        attempts < 50 &&
        existingHues.some(
            (existingHue) =>
                Math.abs(hue - existingHue) < 30 ||
                Math.abs(hue - existingHue) > 330
        )
    );

    // Use consistent saturation and lightness for good readability
    const saturation = 65 + Math.floor(Math.random() * 25); // 65-90%
    const lightness = 75 + Math.floor(Math.random() * 15); // 75-90%

    // Generate random dark mode colors
    const darkSaturation = 45 + Math.floor(Math.random() * 25); // 45-70%
    const darkLightness = 25 + Math.floor(Math.random() * 20); // 25-45%

    // Create CSS custom properties for the colors
    const lightBg = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const lightText = `hsl(${hue}, 70%, 20%)`; // Dark text for light background
    const darkBg = `hsl(${hue}, ${darkSaturation}%, ${darkLightness}%)`;
    const darkText = `hsl(${hue}, 60%, 85%)`; // Light text for dark background

    return {
        hue,
        lightBg,
        lightText,
        darkBg,
        darkText,
        className: `border border-current`,
    };
};
