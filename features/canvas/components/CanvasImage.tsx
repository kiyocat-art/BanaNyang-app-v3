import React from 'react';
import { BoardImage } from '../../../types';
import { useCanvasStore, REF_COLORS } from '../../../store/canvasStore';
import { RoleIndicator } from './RoleIndicator';


interface CanvasImageProps {
    image: BoardImage;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, imageId: string) => void;
}

export const CanvasImage: React.FC<CanvasImageProps> = React.memo(({ image, onContextMenu, onMouseDown }) => {
    const { zoom, selectedImageIds } = useCanvasStore();

    const isSelected = selectedImageIds.has(image.id);
    const hasRole = image.role !== 'none';

    const getRoleColor = () => {
        if (image.role === 'original') return '#22c55e'; // green-500
        if (image.role === 'background') return '#a855f7'; // purple-500
        if (image.role === 'pose') return '#f59e0b'; // amber-500
        if (image.role === 'reference' && image.refIndex !== undefined) {
             return REF_COLORS[image.refIndex % REF_COLORS.length];
        }
        return 'transparent';
    };
    
    let borderStyle = 'solid';
    let borderColor = 'transparent';
    let borderWidth = 0;

    if (hasRole) {
        borderWidth = 3;
        borderColor = getRoleColor();
    } else if (isSelected) {
        borderWidth = 2;
        borderColor = 'white';
        borderStyle = 'dashed';
    }

    const boxShadow = isSelected ? `0 0 ${12 / zoom}px #FFFFFF50` : 'none';

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
                border: `${borderWidth / zoom}px ${borderStyle} ${borderColor}`,
                boxShadow: boxShadow
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