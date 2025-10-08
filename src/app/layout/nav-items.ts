import { BarChart3, Gamepad2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
    disabled?: boolean;
};

export type NavSection = {
    title: string;
    items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
    {
        title: '재고 관리 이벤트',
        items: [
            {
                title: '확률 분석',
                href: '/',
                icon: BarChart3,
            },
            {
                title: '시나리오 시뮬레이션',
                href: '/simulation',
                icon: Gamepad2,
            },
        ],
    },
];
