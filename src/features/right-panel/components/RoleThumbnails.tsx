import React, { useMemo } from 'react';
import { BoardImage } from '../../../types';
import { t, Language } from '../../../localization';
import { useCanvasStore, REF_COLORS } from '../../../store/canvasStore';
import { Tooltip } from '../../../components/Tooltip';
import { RoleIndicator } from './RoleIndicator';

interface RoleThumbnailsProps {
  language: Language;
  onImageDoubleClick: (image: BoardImage) => void;
}

export const RoleThumbnails: React.FC<RoleThumbnailsProps> = ({ language, onImageDoubleClick }) => {
    const { boardImages, activeReferenceIndex, setSelectedImageIds } = useCanvasStore();

    const sortedImages = useMemo(() => {
        const roleOrder: Record<BoardImage['role'], number> = { 'original': 1, 'reference': 2, 'pose': 3, 'background': 4, 'none': 5 };
        return [...boardImages]
            .filter(img => img.role !== 'none')
            .sort((a, b) => {
                const orderA = roleOrder[a.role];
                const orderB = roleOrder[b.role];
                if (orderA !== orderB) return orderA - orderB;
                if (a.role === 'reference') return (a.refIndex ?? 0) - (b.refIndex ?? 0);
                return 0;
            });
    }, [boardImages]);

    if (sortedImages.length === 0) return null;

    const getRoleLabel = (image: BoardImage) => {
        switch (image.role) {
            case 'original': return '원본';
            case 'background': return '배경';
            case 'pose': return '포즈';
            case 'reference': return image.refIndex === 0 ? '참조' : `참조 ${image.refIndex! + 1}`;
            default: return '';
        }
    };
    
    const getRoleColor = (image: BoardImage) => {
        switch (image.role) {
            case 'original': return '#22c55e'; // green-500
            case 'background': return '#a855f7'; // purple-500
            case 'pose': return '#f59e0b'; // amber-500
            case 'reference': return REF_COLORS[image.refIndex! % REF_COLORS.length];
            default: return 'transparent';
        }
    }

    return (
        <div className="absolute top-10 right-full mr-4 z-50 flex flex-col items-center gap-2 bg-neutral-800/50 backdrop-blur-md border border-white/10 p-2 rounded-xl">
            {sortedImages.map((image, index) => {
                const prevImage = index > 0 ? sortedImages[index - 1] : null;
                const showSeparator = prevImage && prevImage.role !== image.role && image.role !== 'reference';
                
                const isRef = image.role === 'reference';
                const isActiveRef = isRef && image.refIndex === activeReferenceIndex;
                const roleColor = getRoleColor(image);
                const finalBorderColor = isActiveRef ? '#FFFFFF' : roleColor;
                const borderWidthClass = isActiveRef ? 'border-4' : 'border-2';
                
                const handleClick = () => {
                    if (isRef) {
                        setSelectedImageIds(prev => new Set([image.id]));
                    }
                };

                return (
                    <React.Fragment key={image.id}>
                        {showSeparator && (
                            <div className="w-16 h-px bg-zinc-600" />
                        )}
                        <Tooltip tip={getRoleLabel(image)} position="left">
                            <button
                                onClick={handleClick}
                                onDoubleClick={() => onImageDoubleClick(image)}
                                className={`relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-700 transition-all hover:opacity-80 ${isRef ? 'cursor-pointer' : 'cursor-default'} ${borderWidthClass}`}
                                style={{ borderColor: finalBorderColor }}
                            >
                                <RoleIndicator role={image.role} refIndex={image.refIndex} zoom={1} />
                                <img src={image.src} alt={getRoleLabel(image)} className="w-full h-full object-cover" />
                            </button>
                        </Tooltip>
                    </React.Fragment>
                );
            })}
        </div>
    );
};