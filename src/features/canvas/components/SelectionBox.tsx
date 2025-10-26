import React, { useRef } from 'react';
import { useCanvasStore } from '../../../store/canvasStore.ts';

export const SelectionBox: React.FC<{
    bounds: { x: number; y: number; width: number; height: number; };
}> = ({ bounds }) => {
    const { zoom } = useCanvasStore();
    const interactionRef = useRef<{
        startX: number;
        startY: number;
        initialBounds: typeof bounds;
        initialGeometries: {
            images: Map<string, { x: number; y: number; width: number; height: number }>;
            groups: Map<string, { x: number; y: number; width: number; height: number }>;
        };
    } | null>(null);

    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const { boardImages, boardGroups, selectedImageIds, selectedGroupIds } = useCanvasStore.getState();
        
        const geometries = {
            images: new Map<string, { x: number; y: number; width: number; height: number }>(),
            groups: new Map<string, { x: number; y: number; width: number; height: number }>(),
        };

        const imageIdsInSelectedGroups = new Set(
            boardGroups.filter(g => selectedGroupIds.has(g.id)).flatMap(g => g.imageIds)
        );

        boardImages.forEach(img => {
            if (selectedImageIds.has(img.id) || imageIdsInSelectedGroups.has(img.id)) {
                geometries.images.set(img.id, { x: img.x, y: img.y, width: img.width, height: img.height });
            }
        });

        boardGroups.forEach(group => {
            if (selectedGroupIds.has(group.id)) {
                geometries.groups.set(group.id, { x: group.x, y: group.y, width: group.width, height: group.height });
            }
        });
        
        interactionRef.current = { startX: e.clientX, startY: e.clientY, initialBounds: bounds, initialGeometries: geometries };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!interactionRef.current) return;
        
            const screenDx = moveEvent.clientX - interactionRef.current.startX;
            const { initialBounds, initialGeometries } = interactionRef.current;
        
            const newWidth = initialBounds.width + (screenDx / zoom);
        
            if (newWidth < 20) return;
        
            const scale = newWidth / initialBounds.width;
            if (!isFinite(scale) || initialBounds.width === 0) return;
            const anchor = { x: initialBounds.x, y: initialBounds.y };

            useCanvasStore.setState(state => {
                const newImages = state.boardImages.map(img => {
                    const initialGeo = initialGeometries.images.get(img.id);
                    if (initialGeo) {
                        return {
                            ...img,
                            x: anchor.x + (initialGeo.x - anchor.x) * scale,
                            y: anchor.y + (initialGeo.y - anchor.y) * scale,
                            width: initialGeo.width * scale,
                            height: initialGeo.height * scale,
                        };
                    }
                    return img;
                });
                const newGroups = state.boardGroups.map(group => {
                    const initialGeo = initialGeometries.groups.get(group.id);
                    if (initialGeo) {
                        return {
                            ...group,
                            x: anchor.x + (initialGeo.x - anchor.x) * scale,
                            y: anchor.y + (initialGeo.y - anchor.y) * scale,
                            width: initialGeo.width * scale,
                            height: initialGeo.height * scale,
                        };
                    }
                    return group;
                });
                return { boardImages: newImages, boardGroups: newGroups };
            });
        };

        const handleMouseUp = () => {
            interactionRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className="absolute pointer-events-none"
            style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height, zIndex: 9999 }}
        >
            <div className="w-full h-full border-2 border-dashed border-white" style={{ borderWidth: `${2 / zoom}px` }} />
            <div
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-zinc-800 rounded-full cursor-se-resize pointer-events-auto"
                style={{ 
                    transform: `scale(${1/zoom})`,
                    transformOrigin: 'bottom right',
                    bottom: 0,
                    right: 0,
                }}
                onMouseDown={handleResizeMouseDown}
            />
        </div>
    );
};
