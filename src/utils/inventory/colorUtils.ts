export interface ObjectTypeColor {
    hue: number;
    lightBg: string;
    lightText: string;
    darkBg: string;
    darkText: string;
    className: string;
}

const PREDEFINED_COLORS: ObjectTypeColor[] = [
    {
        hue: 210,
        lightBg: 'hsl(210, 70%, 85%)',
        lightText: 'hsl(210, 70%, 20%)',
        darkBg: 'hsl(210, 62%, 22%)',
        darkText: 'hsl(210, 62%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 120,
        lightBg: 'hsl(120, 70%, 85%)',
        lightText: 'hsl(120, 70%, 20%)',
        darkBg: 'hsl(120, 62%, 22%)',
        darkText: 'hsl(120, 62%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 30,
        lightBg: 'hsl(30, 80%, 85%)',
        lightText: 'hsl(30, 80%, 20%)',
        darkBg: 'hsl(30, 72%, 24%)',
        darkText: 'hsl(30, 72%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 270,
        lightBg: 'hsl(270, 70%, 85%)',
        lightText: 'hsl(270, 70%, 20%)',
        darkBg: 'hsl(270, 62%, 22%)',
        darkText: 'hsl(270, 62%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 330,
        lightBg: 'hsl(330, 75%, 85%)',
        lightText: 'hsl(330, 75%, 20%)',
        darkBg: 'hsl(330, 67%, 22%)',
        darkText: 'hsl(330, 67%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 180,
        lightBg: 'hsl(180, 70%, 85%)',
        lightText: 'hsl(180, 70%, 20%)',
        darkBg: 'hsl(180, 62%, 22%)',
        darkText: 'hsl(180, 62%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 90,
        lightBg: 'hsl(90, 70%, 85%)',
        lightText: 'hsl(90, 70%, 20%)',
        darkBg: 'hsl(90, 62%, 22%)',
        darkText: 'hsl(90, 62%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 240,
        lightBg: 'hsl(240, 70%, 85%)',
        lightText: 'hsl(240, 70%, 20%)',
        darkBg: 'hsl(240, 62%, 22%)',
        darkText: 'hsl(240, 62%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 0,
        lightBg: 'hsl(0, 75%, 85%)',
        lightText: 'hsl(0, 75%, 20%)',
        darkBg: 'hsl(0, 67%, 22%)',
        darkText: 'hsl(0, 67%, 90%)',
        className: 'border border-current',
    },
    {
        hue: 45,
        lightBg: 'hsl(45, 80%, 85%)',
        lightText: 'hsl(45, 80%, 20%)',
        darkBg: 'hsl(45, 72%, 24%)',
        darkText: 'hsl(45, 72%, 90%)',
        className: 'border border-current',
    },
];

export const generateColorForObjectType = (
    existingColors: { [objectIndex: number]: ObjectTypeColor },
    objectIndex?: number
): ObjectTypeColor => {
    if (objectIndex !== undefined && objectIndex < PREDEFINED_COLORS.length) {
        return PREDEFINED_COLORS[objectIndex];
    }

    const existingHues = Object.values(existingColors)
        .map((color) => {
            if (color && color.hue) return color.hue;
            return -1;
        })
        .filter((hue) => hue >= 0);

    let hue: number;
    let attempts = 0;

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

    const saturation = 65 + Math.floor(Math.random() * 25);
    const lightness = 75 + Math.floor(Math.random() * 15);

    const darkSaturation = 55 + Math.floor(Math.random() * 20);
    const darkLightness = 18 + Math.floor(Math.random() * 12);

    const lightBg = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const lightText = `hsl(${hue}, 70%, 20%)`;
    const darkBg = `hsl(${hue}, ${darkSaturation}%, ${darkLightness}%)`;
    const darkText = `hsl(${hue}, 65%, 90%)`;

    return {
        hue,
        lightBg,
        lightText,
        darkBg,
        darkText,
        className: `border border-current`,
    };
};
