import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tooltip } from './Tooltip';
import { CloseIcon } from './icons';
import { t, Language } from '../localization';

interface ImageViewerModalProps {
  src: string;
  onClose: () => void;
  language: Language;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ src, onClose, language }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<{ startX: number, startY: number, startPan: {x: number, y: number} } | null>(null);

  const resetTransform = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || !image.naturalWidth) return;

    const containerRect = container.getBoundingClientRect();
    const imageAspectRatio = image.naturalWidth / image.naturalHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;

    let initialWidth, initialHeight;
    if (imageAspectRatio > containerAspectRatio) {
      initialWidth = containerRect.width;
      initialHeight = initialWidth / imageAspectRatio;
    } else {
      initialHeight = containerRect.height;
      initialWidth = initialHeight * imageAspectRatio;
    }

    const initialScale = initialWidth > 0 ? initialWidth / image.naturalWidth : 1;
    setScale(initialScale);
    setPosition({ x: (containerRect.width - initialWidth) / 2, y: (containerRect.height - initialHeight) / 2 });
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (image && container) {
      const handleLoad = () => resetTransform();
      image.addEventListener('load', handleLoad);
      if (image.complete) {
        handleLoad();
      }
      
      const resizeObserver = new ResizeObserver(resetTransform);
      resizeObserver.observe(container);

      return () => {
          image.removeEventListener('load', handleLoad);
          resizeObserver.unobserve(container);
      }
    }
  }, [src, resetTransform]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
        } else if (e.key === ' ' || e.code === 'Space') { 
            e.preventDefault(); 
            e.stopPropagation();
            setIsSpacebarPressed(true); 
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.code === 'Space') {
            e.stopPropagation();
            setIsSpacebarPressed(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [onClose]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const isPanGesture = e.button === 1 || (isSpacebarPressed && e.button === 0);
    const isPotentialClickToClose = e.button === 0 && e.target === containerRef.current;

    if (!isPanGesture && !isPotentialClickToClose) {
        return;
    }

    let moved = false;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!moved && (Math.abs(moveEvent.clientX - startX) > 5 || Math.abs(moveEvent.clientY - startY) > 5)) {
            moved = true;
        }

        if (interactionRef.current) { // Panning
            const dx = moveEvent.clientX - interactionRef.current.startX;
            const dy = moveEvent.clientY - interactionRef.current.startY;
            setPosition({ x: interactionRef.current.startPan.x + dx, y: interactionRef.current.startPan.y + dy });
        }
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        if (!moved && isPotentialClickToClose) {
            onClose();
        }
        
        if (interactionRef.current) {
            interactionRef.current = null;
            containerRef.current?.classList.remove('cursor-grabbing');
        }
    };

    if (isPanGesture) {
        e.preventDefault();
        e.stopPropagation();
        interactionRef.current = { startX: e.clientX, startY: e.clientY, startPan: position };
        containerRef.current?.classList.add('cursor-grabbing');
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
};
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = 1.4;
    const newScale = e.deltaY < 0 ? scale * scaleAmount : scale / scaleAmount;
    const clampedScale = Math.max(0.1, Math.min(10, newScale));
    
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPosX = mouseX - (mouseX - position.x) * (clampedScale / scale);
    const newPosY = mouseY - (mouseY - position.y) * (clampedScale / scale);

    setScale(clampedScale);
    setPosition({x: newPosX, y: newPosY});
  };

  const cursorClass = isSpacebarPressed ? 'cursor-grab' : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] select-none ${cursorClass}`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
        <img
          key={src}
          ref={imageRef}
          src={src}
          alt="Zoomed view"
          className={`max-w-none max-h-none absolute object-contain pointer-events-none`}
          style={{ 
            top: 0,
            left: 0,
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
            transformOrigin: 'top left' 
          }}
        />
        <div className="absolute top-4 right-4 sm:right-8">
            <Tooltip tip={t('close', language)} position="bottom">
                <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-sm rounded-lg border border-white/20" aria-label={t('close', language)}>
                    <CloseIcon className="h-6 w-6" />
                </button>
            </Tooltip>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-zinc-300 text-xs px-3 py-1.5 rounded-full pointer-events-none">
          휠: 확대/축소 | 스페이스바/휠 클릭 + 드래그: 이동
        </div>
    </div>
  );
};
