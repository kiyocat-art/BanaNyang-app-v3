import { useMemo } from 'react';
import { BoardImage, BoardGroup } from '../../../types';

interface UseVisibleObjectsProps {
    boardImages: BoardImage[];
    boardGroups: BoardGroup[];
    pan: { x: number; y: number };
    zoom: number;
    canvasRect: DOMRect | null;
}

const PADDING = 200; // Render objects 200px outside the viewport to prevent pop-in

export const useVisibleObjects = ({ boardImages, boardGroups, pan, zoom, canvasRect }: UseVisibleObjectsProps) => {
    const visibleObjects = useMemo(() => {
        if (!canvasRect || !zoom) {
            return { visibleImages: boardImages, visibleGroups: boardGroups };
        }

        const viewLeft = (-pan.x - PADDING) / zoom;
        const viewTop = (-pan.y - PADDING) / zoom;
        const viewRight = (-pan.x + canvasRect.width + PADDING) / zoom;
        const viewBottom = (-pan.y + canvasRect.height + PADDING) / zoom;

        const isVisible = (obj: { x: number; y: number; width: number; height: number }) => {
            return (
                obj.x < viewRight &&
                obj.x + obj.width > viewLeft &&
                obj.y < viewBottom &&
                obj.y + obj.height > viewTop
            );
        };

        const visibleImages = boardImages.filter(isVisible);
        const visibleGroups = boardGroups.filter(isVisible);

        return { visibleImages, visibleGroups };
    }, [boardImages, boardGroups, pan, zoom, canvasRect]);

    return visibleObjects;
};
