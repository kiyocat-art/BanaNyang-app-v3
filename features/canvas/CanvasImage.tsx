import React from 'react';
import { BoardImage } from '../../types';
import { useCanvasStore, REF_COLORS } from '../../store/canvasStore';
import { RoleIndicator } from './RoleIndicator';


interface CanvasImageProps {
    image: BoardImage;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>, imageId: string) => void;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, imageId: string) => void;
}

export const CanvasImage: React.FC<CanvasImageProps> = ({ image, onContextMenu, onMouseDown }) => {
    const { zoom, selectedImageIds } = useCanvasStore();

    const isSelected = selectedImageIds.has(image.id);

    const getRoleColor = () => {
        if (image.role === 'original') return '#22c55e'; // green-500
        if (image.role === 'background') return '#a855f7'; // purple-500
        if (image.role === 'pose') return '#f59e0b'; // amber-500
        if (image.role === 'reference' && image.refIndex !== undefined) {
             return REF_COLORS[image.refIndex % REF_COLORS.length];
        }
        return 'transparent';
    };

    const roleColor = getRoleColor();
    const borderColor = isSelected ? '#FFFFFF' : roleColor;
    const shadowColor = isSelected ? '#FFFFFF' : roleColor;
    const borderWidth = isSelected ? 3 : 2;

    return (
        <div
            className={`absolute select-none`}
            style={{
                left: image.x,
                top: image.y,
                width: image.width,
                height: image.height,
                zIndex: image.zIndex,
                cursor: 'grab',
                border: `${borderWidth / zoom}px solid ${borderColor}`,
                boxShadow: `0 0 ${12 / zoom}px ${shadowColor === 'transparent' ? 'rgba(0,0,0,0)' : shadowColor+'50'}`
            }}
            onMouseDown={(e) => onMouseDown(e, image.id)}
            onContextMenu={(e) => onContextMenu(e, image.id)}
        >
            <RoleIndicator role={image.role} refIndex={image.refIndex} zoom={zoom}/>
            <img src={image.src} alt={image.file.name} className="w-full h-full object-contain pointer-events-none" />
        </div>
    );
};