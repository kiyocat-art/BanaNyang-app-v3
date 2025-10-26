import React from 'react';
import { BoardImage } from '../../../types';
import { useCanvasStore, REF_COLORS } from '../../../store/canvasStore';
import { RoleIndicator } from './RoleIndicator';
import { ROLE_COLORS } from '../../../constants';


interface CanvasImageProps {
    image: BoardImage;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, imageId: string) => void;
}

export const CanvasImage: React.FC<CanvasImageProps> = React.memo(({ image, onContextMenu, onMouseDown }) => {
    const { zoom, selectedImageIds, groupEditModeId } = useCanvasStore();

    const isSelected = selectedImageIds.has(image.id);
    const hasRole = image.role !== 'none';

    const isInEditMode = !!groupEditModeId;
    const isPartOfEditingGroup = image.groupId === groupEditModeId;
    const isDimmed = isInEditMode && !isPartOfEditingGroup && !image.groupId;


    const getRoleColor = () => {
        if (image.role === 'original') return ROLE_COLORS.original;
        if (image.role === 'background') return ROLE_COLORS.background;
        if (image.role === 'pose') return ROLE_COLORS.pose;
        if (image.role === 'reference' && image.refIndex !== undefined) {
             return REF_COLORS[image.refIndex % REF_COLORS.length];
        }
        return 'transparent';
    };
    
    const roleColor = getRoleColor();
    let borderStyle = 'solid';
    let borderColor = 'transparent';
    let borderWidth = 0;
    let boxShadow = 'none';

    if (hasRole) {
        borderWidth = 3;
        borderColor = roleColor;
    }

    if (isSelected) {
        const outlineWidth = 2 / zoom;
        const blurRadius = Math.min(30, 12 / zoom); 
        
        if (hasRole) {
            boxShadow = `0 0 0 ${outlineWidth}px white, 0 0 ${blurRadius}px rgba(255,255,255,0.5)`;
        } else {
            borderWidth = 2;
            borderColor = 'white';
            borderStyle = 'solid'; // Changed to solid for clarity
            boxShadow = `0 0 ${blurRadius}px rgba(255,255,255,0.5)`;
        }
    }

    return (
        <div
            className={`absolute select-none transition-opacity duration-300`}
            style={{
                left: image.x,
                top: image.y,
                width: image.width,
                height: image.height,
                zIndex: image.zIndex,
                cursor: 'grab',
                border: `${borderWidth / zoom}px ${borderStyle} ${borderColor}`,
                boxShadow: boxShadow,
                opacity: isDimmed ? 0.3 : 1,
            }}
            onMouseDown={(e) => onMouseDown(e, image.id)}
            onContextMenu={onContextMenu}
        >
            <RoleIndicator role={image.role} refIndex={image.refIndex} zoom={zoom}/>
            <img src={image.src} alt={image.file.name} className="w-full h-full object-contain pointer-events-none" />
            {image.maskSrc && (
                <div
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{
                        zIndex: 1,
                        maskImage: `url(${image.maskSrc})`,
                        WebkitMaskImage: `url(${image.maskSrc})`,
                        maskSize: '100% 100%',
                        WebkitMaskSize: '100% 100%',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                        backgroundColor: 'rgba(56, 189, 248, 0.5)', // sky-400 with 50% opacity
                        maskMode: 'luminance',
                    }}
                />
            )}
        </div>
    );
});
