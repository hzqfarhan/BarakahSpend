// SVG icons for navigation — no emoji, pure inline SVG
import React from 'react';

type IconProps = {
    size?: number;
    className?: string;
};

export function IconHome({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V13h6v8" />
        </svg>
    );
}

export function IconExpenses({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M6 14h.01M10 14h4" />
        </svg>
    );
}

export function IconSedekah({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 21C12 21 4 14.5 4 9.5C4 6.5 6.5 4 9.5 4c1.74 0 3.29.87 4.22 2.16" />
            <path d="M12 21C12 21 20 14.5 20 9.5C20 6.5 17.5 4 14.5 4c-1.74 0-3.29.87-4.22 2.16" />
            <path d="M12 13l-2-2M12 13l2-2M12 13V7" />
        </svg>
    );
}

export function IconZakat({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v4l2 2" />
            <path d="M8.5 16.5L12 12" />
            <path d="M9 8.5a4 4 0 016 0" />
        </svg>
    );
}

export function IconRamadan({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 3a7 7 0 00-4 12.7A7 7 0 1012 3z" />
            <path d="M19 6l-1.5 1.5M19 6l1 .5M19 6l.5-1" />
        </svg>
    );
}

export function IconChat({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            <path d="M9 10h.01M12 10h.01M15 10h.01" />
        </svg>
    );
}

export function IconSettings({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    );
}

export function IconSignOut({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

export function IconCollapse({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    );
}

export function IconMasjid({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 21V12M18 21V12" />
            <path d="M4 21h16" />
            <path d="M12 3C9 3 6 7 6 12h12c0-5-3-9-6-9z" />
            <path d="M9 21v-4a3 3 0 016 0v4" />
            <path d="M3 12h2M19 12h2" />
            <circle cx="12" cy="9" r="1" />
        </svg>
    );
}

export function IconUpload({ size = 22, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    );
}
