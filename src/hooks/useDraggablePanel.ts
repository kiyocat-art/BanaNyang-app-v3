import React, { useState, useRef, useEffect, useCallback } from 'react';

const PANEL_HEADER_HEIGHT = 40;
const MIN_PANEL_WIDTH = 300;
const MIN_PANEL_HEIGHT = 350;

export const useDraggablePanel = (initialState: { x: number; y: number; width: number; height: number; isCollapsed: boolean; }) => {
    const [panelState, setPanelState] = useState(initialState);
    const dragInteractionRef = useRef<{ type: 'drag' | 'resize', direction?: string, startX: number, startY: number, startState: typeof panelState } | null>(null);

    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragInteractionRef.current = { type: 'drag', startX: e.clientX, startY: e.clientY, startState: panelState };
        document.body.style.userSelect = 'none';
    }, [panelState]);

    const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        dragInteractionRef.current = { type: 'resize', direction, startX: e.clientX, startY: e.clientY, startState: panelState };
        document.body.style.userSelect = 'none';
    }, [panelState]);

    const toggleCollapse = useCallback(() => {
        setPanelState(p => ({ ...p, isCollapsed: !p.isCollapsed }));
    }, []);
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragInteractionRef.current) return;
            const { type, startX, startY, startState, direction } = dragInteractionRef.current;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (type === 'drag') {
                const newX = startState.x + dx;
                const newY = startState.y + dy;
                const clampedX = Math.max(0, Math.min(newX, window.innerWidth - startState.width));
                const clampedY = Math.max(0, Math.min(newY, window.innerHeight - PANEL_HEADER_HEIGHT));
                setPanelState(prev => ({ ...prev, x: clampedX, y: clampedY }));
            } else if (type === 'resize' && direction) {
                let { x, y, width, height } = startState;
                height = Math.max(MIN_PANEL_HEIGHT, startState.height + dy);
                
                if (direction.includes('e')) { // Resizing from the right
                    width = Math.max(MIN_PANEL_WIDTH, startState.width + dx);
                }
                if (direction.includes('w')) { // Resizing from the left
                    const newWidth = startState.width - dx;
                    if (newWidth < MIN_PANEL_WIDTH) {
                        width = MIN_PANEL_WIDTH;
                        x = startState.x + (startState.width - MIN_PANEL_WIDTH);
                    } else {
                        width = newWidth;
                        x = startState.x + dx;
                    }
                }
                
                height = Math.min(height, window.innerHeight - y);
                if (x < 0) {
                    if (direction === 'sw') width += x;
                    x = 0;
                }
                if (x + width > window.innerWidth) {
                    if (direction === 'se') width = window.innerWidth - x;
                }
                if (width < MIN_PANEL_WIDTH) width = MIN_PANEL_WIDTH;
                
                setPanelState(prev => ({ ...prev, x, width, height }));
            }
        };

        const handleMouseUp = () => {
            dragInteractionRef.current = null;
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setPanelState(prev => ({
                ...prev,
                x: Math.max(0, Math.min(prev.x, window.innerWidth - prev.width)),
                y: Math.max(0, Math.min(prev.y, window.innerHeight - 40)),
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { panelState, setPanelState, handleDragStart, handleResizeStart, toggleCollapse };
};
