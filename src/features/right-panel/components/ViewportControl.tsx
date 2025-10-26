import React, { useState, useRef, useEffect, useCallback } from 'react';
import { t, Language, TranslationKey } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';

// --- Viewport Control Optimization ---
// Snap Points Configuration
const PITCH_SNAP_POINTS = Array.from({ length: 11 }, (_, i) => -90 + i * 18); // 10 steps -> 11 points
const YAW_SNAP_POINTS = Array.from({ length: 16 }, (_, i) => i * 22.5); // 16 steps

// Helper Functions
const findClosest = (target: number, values: number[]): number => {
  return values.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
};

const findClosestCircular = (target: number, values: number[]): number => {
  const normalizedTarget = ((target % 360) + 360) % 360;
  const dist = (a: number, b: number) => {
    const d = Math.abs(a - b);
    return Math.min(d, 360 - d);
  };
  return values.reduce((prev, curr) => {
    return dist(normalizedTarget, curr) < dist(normalizedTarget, prev) ? curr : prev;
  });
};

// --- 3D Viewport Control Component ---
export const ViewportControl: React.FC<{
  value: { yaw: number, pitch: number };
  onChange: (value: { yaw: number, pitch: number }) => void;
  language: Language;
  isActive?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  cubeFaceClassName?: string;
  inactiveCubeFaceClassName?: string;
  tooltipText: string;
}> = ({ value, onChange, language, isActive = true, onActivate, onDeactivate, cubeFaceClassName, inactiveCubeFaceClassName, tooltipText }) => {
  const [rotation, setRotation] = useState({ yaw: value.yaw, pitch: value.pitch });
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const startClientPos = useRef({ x: 0, y: 0 });
  const startValue = useRef({ yaw: 0, pitch: 0 });
  
  // Use a ref to hold the latest props to avoid stale closures in event listeners
  const propsRef = useRef({ value, onChange, isActive, onActivate, onDeactivate });
  useEffect(() => {
    propsRef.current = { value, onChange, isActive, onActivate, onDeactivate };
  }, [value, onChange, isActive, onActivate, onDeactivate]);


  useEffect(() => {
    setIsTransitioning(true);
    const currentYaw = rotation.yaw;
    const targetYaw = value.yaw;
    const revolution = Math.round(currentYaw / 360);
    const candidates = [targetYaw + 360 * revolution, targetYaw + 360 * (revolution - 1), targetYaw + 360 * (revolution + 1)];
    const closestYaw = candidates.reduce((prev, curr) => (Math.abs(curr - currentYaw) < Math.abs(prev - currentYaw) ? curr : prev));
    
    setRotation({ yaw: closestYaw, pitch: value.pitch });
    
    const timer = setTimeout(() => setIsTransitioning(false), isDragging.current ? 0 : 300);
    return () => clearTimeout(timer);
  }, [value.yaw, value.pitch]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    didDrag.current = false;
    setIsTransitioning(false);
    
    startClientPos.current = { x: e.clientX, y: e.clientY };
    startValue.current = { yaw: propsRef.current.value.yaw, pitch: propsRef.current.value.pitch };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current || !propsRef.current.isActive) return;

        const initialDx = moveEvent.clientX - startClientPos.current.x;
        const initialDy = moveEvent.clientY - startClientPos.current.y;
        if (!didDrag.current && (Math.abs(initialDx) > 3 || Math.abs(initialDy) > 3)) {
            didDrag.current = true;
        }
        
        if (!didDrag.current) return;

        const deltaX = moveEvent.clientX - startClientPos.current.x;
        const deltaY = moveEvent.clientY - startClientPos.current.y;
        const sensitivity = 0.4;

        const newYaw = startValue.current.yaw + deltaX * sensitivity;
        let newPitch = startValue.current.pitch - deltaY * sensitivity;

        newPitch = Math.max(-90, Math.min(90, newPitch));
        
        const snappedPitch = findClosest(newPitch, PITCH_SNAP_POINTS);
        const snappedYaw = findClosestCircular(newYaw, YAW_SNAP_POINTS);

        if (snappedYaw !== propsRef.current.value.yaw || snappedPitch !== propsRef.current.value.pitch) {
          propsRef.current.onChange({ yaw: snappedYaw, pitch: snappedPitch });
        }
    };
  
    const handleMouseUp = () => {
        if (isDragging.current) {
            if (!didDrag.current) {
                // Click logic
                const { isActive, onActivate, onDeactivate } = propsRef.current;
                if (isActive && onDeactivate) onDeactivate();
                else if (!isActive && onActivate) onActivate();
            }
        }
        
        isDragging.current = false;
        setIsTransitioning(true);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []); // Empty dependency array is crucial for this pattern

  return (
    <Tooltip tip={tooltipText} position="bottom">
        <div 
            className={`p-4 ${!isActive ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} flex justify-center items-center`}
            onMouseDown={handleMouseDown}
        >
        <div className="w-28 h-28 lg:w-32 lg:h-32" style={{ perspective: '800px' }}>
            <div
            className="w-full h-full relative pointer-events-none"
            style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotation.pitch}deg) rotateY(${rotation.yaw}deg)`,
                transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
            }}
            >
            {[
                { face: 'front', transform: 'rotateY(0deg) translateZ(3.5rem) lg:rotateY(0deg) lg:translateZ(4rem)' },
                { face: 'back', transform: 'rotateY(180deg) translateZ(3.5rem) lg:rotateY(180deg) lg:translateZ(4rem)' },
                { face: 'right', transform: 'rotateY(90deg) translateZ(3.5rem) lg:rotateY(90deg) lg:translateZ(4rem)' },
                { face: 'left', transform: 'rotateY(-90deg) translateZ(3.5rem) lg:rotateY(-90deg) lg:translateZ(4rem)' },
                { face: 'top', transform: 'rotateX(90deg) translateZ(3.5rem) lg:rotateX(90deg) lg:translateZ(4rem)' },
                { face: 'bottom', transform: 'rotateX(-90deg) translateZ(3.5rem) lg:rotateX(-90deg) lg:translateZ(4rem)' },
            ].map(({ face, transform }) => (
                <div key={face} className={`absolute inset-0 flex items-center justify-center select-none text-xs lg:text-sm font-bold ${isActive ? (cubeFaceClassName || 'bg-neutral-700/80 border border-neutral-500/50') : (inactiveCubeFaceClassName || 'bg-neutral-700/50 border border-neutral-600/50')}`} style={{ transform }}>
                    {t(`viewport.${face}` as TranslationKey, language)}
                </div>
            ))}
            </div>
        </div>
        </div>
    </Tooltip>
  );
};
