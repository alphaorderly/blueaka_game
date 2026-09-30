export type NavItem = {
    title: string;
    href: string;
};

export const NAV_ITEMS: NavItem[] = [
    { title: '확률', href: '/inventory/predict' },
    { title: '시뮬레이션', href: '/inventory/simulate' },
];
