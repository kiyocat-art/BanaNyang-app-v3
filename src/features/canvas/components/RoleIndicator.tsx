import React from 'react';
import { BoardImage } from '../../../types';
import { REF_COLORS } from '../../../store/canvasStore';
import { LandscapeIcon, BodyIcon } from '../../../components/icons';
import { ROLE_COLORS } from '../../../constants';

export const RoleIndicator: React.FC<{ role: BoardImage['role'], refIndex?: number, zoom: number }> = ({ role, refIndex, zoom }) => {
    if (role === 'none') return null;
    let bgColor = '';
    let content: React.ReactNode = null;
    let customClasses = 'w-5 h-5 rounded-full';
    let transform = `scale(${1/zoom}) translate(-50%, -50%)`;

    if (role === 'original') {
        bgColor = ROLE_COLORS.original;
        content = <span className="text-[10px] font-bold text-white leading-none whitespace-nowrap">원본</span>;
        customClasses = 'w-auto px-1.5 h-5 rounded-md';
        transform = `scale(${1/zoom}) translate(-25%, -25%)`;
    } else if (role === 'background') {
        bgColor = ROLE_COLORS.background;
        content = <LandscapeIcon className="w-3 h-3 text-white" />;
    } else if (role === 'pose') {
        bgColor = ROLE_COLORS.pose;
        content = <BodyIcon className="w-3 h-3 text-white" />;
    } else if (role === 'reference' && refIndex !== undefined) {
        bgColor = REF_COLORS[refIndex % REF_COLORS.length];
        const label = refIndex === 0 ? '참조' : `참조 ${refIndex + 1}`;
        content = <span className="text-[10px] font-bold text-white leading-none whitespace-nowrap">{label}</span>;
        customClasses = 'w-auto px-1.5 h-5 rounded-md';
        transform = `scale(${1/zoom}) translate(-25%, -25%)`;
    }

    if (!content) return null;

    const commonClasses = `absolute top-0 left-0 flex items-center justify-center shadow-lg pointer-events-none z-10`;

    return (
        <div 
            className={`${commonClasses} ${customClasses}`}
            style={{ 
                backgroundColor: bgColor,
                transform: transform,
                transformOrigin: 'top left'
            }}
        >
            {content}
        </div>
    );
};
