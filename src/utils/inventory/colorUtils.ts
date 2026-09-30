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
        hue: 245,
        lightBg: 'oklch(0.84 0.08 245)',
        lightText: 'oklch(0.36 0.1 250)',
        darkBg: 'oklch(0.44 0.1 250)',
        darkText: 'oklch(0.93 0.04 245)',
        className: '',
    },
    {
        hue: 175,
        lightBg: 'oklch(0.85 0.09 175)',
        lightText: 'oklch(0.36 0.07 180)',
        darkBg: 'oklch(0.42 0.08 178)',
        darkText: 'oklch(0.93 0.05 175)',
        className: '',
    },
    {
        hue: 30,
        lightBg: 'oklch(0.84 0.09 35)',
        lightText: 'oklch(0.4 0.12 30)',
        darkBg: 'oklch(0.46 0.11 32)',
        darkText: 'oklch(0.93 0.04 35)',
        className: '',
    },
    {
        hue: 135,
        lightBg: 'oklch(0.87 0.11 135)',
        lightText: 'oklch(0.38 0.09 138)',
        darkBg: 'oklch(0.44 0.1 138)',
        darkText: 'oklch(0.94 0.06 135)',
        className: '',
    },
    {
        hue: 210,
        lightBg: 'oklch(0.86 0.07 210)',
        lightText: 'oklch(0.37 0.07 215)',
        darkBg: 'oklch(0.43 0.07 212)',
        darkText: 'oklch(0.93 0.04 210)',
        className: '',
    },
    {
        hue: 270,
        lightBg: 'oklch(0.84 0.07 270)',
        lightText: 'oklch(0.38 0.1 272)',
        darkBg: 'oklch(0.42 0.09 272)',
        darkText: 'oklch(0.93 0.04 270)',
        className: '',
    },
    {
        hue: 105,
        lightBg: 'oklch(0.88 0.09 110)',
        lightText: 'oklch(0.39 0.08 110)',
        darkBg: 'oklch(0.45 0.09 110)',
        darkText: 'oklch(0.94 0.05 110)',
        className: '',
    },
    {
        hue: 55,
        lightBg: 'oklch(0.82 0.07 55)',
        lightText: 'oklch(0.38 0.07 50)',
        darkBg: 'oklch(0.44 0.07 52)',
        darkText: 'oklch(0.93 0.03 55)',
        className: '',
    },
    {
        hue: 15,
        lightBg: 'oklch(0.82 0.1 15)',
        lightText: 'oklch(0.4 0.13 20)',
        darkBg: 'oklch(0.44 0.12 18)',
        darkText: 'oklch(0.93 0.04 15)',
        className: '',
    },
    {
        hue: 155,
        lightBg: 'oklch(0.83 0.06 155)',
        lightText: 'oklch(0.36 0.06 155)',
        darkBg: 'oklch(0.42 0.06 155)',
        darkText: 'oklch(0.93 0.03 155)',
        className: '',
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
    const lightText = `hsl(${hue}, 60%, 25%)`;
    const darkBg = `hsl(${hue}, ${darkSaturation}%, ${darkLightness + 12}%)`;
    const darkText = `hsl(${hue}, 65%, 92%)`;

    return {
        hue,
        lightBg,
        lightText,
        darkBg,
        darkText,
        className: '',
    };
};
