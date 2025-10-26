import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  BodyPart, ClothingItem, SelectedView,
  ActionPose, ObjectItem
} from './types';
import { 
  CLOTHING_THEMES,
  OBJECT_THEMES,
  CLOTHING_TO_BODY_PARTS_MAP,
  APPLY_FULL_OUTFIT_BODY_PARTS,
  APPLY_TOP_BODY_PARTS,
  APPLY_BOTTOM_BODY_PARTS,
  CLOTHING_ITEM_TO_CATEGORY_MAP,
} from './constants';
import { t, getEnumText, Language, TranslationKey } from './localization';
import { Tooltip } from './components/Tooltip';
import { Section } from './components/Section';
import {
  CameraIcon, PaletteIcon, BodyIcon, LightIcon, ResetIcon, UndoIcon, RedoIcon
} from './components/icons';
import { useCanvasStore, REF_COLORS } from './store/canvasStore';
import { useGenerationStore } from './store/generationStore';

type ConceptThemeKey = 'scifi' | 'modern' | 'fantasy';
type ConceptSubTabKey = 'clothing' | 'item';
type RightPanelTab = 'concept' | 'camera' | 'pose';

const BodyPartSelector: React.FC<{
  bodyPartReferenceMap: Partial<Record<BodyPart, number>>;
  onAssign: (part: BodyPart) => void;
  language: Language;
}> = ({ bodyPartReferenceMap, onAssign, language }) => {
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const activeReferenceIndex = useCanvasStore(state => state.activeReferenceIndex);

    const getPartStyle = (part: BodyPart) => {
        const refIndex = bodyPartReferenceMap[part];
        const isSelectedForActiveRef = activeReferenceIndex !== null && refIndex === activeReferenceIndex;

        let fillColor = 'rgba(113, 113, 122, 0.4)'; // neutral-500/40
        let strokeColor = 'rgb(82, 82, 91)'; // neutral-600

        if(refIndex !== undefined) {
          fillColor = REF_COLORS[refIndex % REF_COLORS.length] + 'BF'; // Add alpha
          strokeColor = REF_COLORS[refIndex % REF_COLORS.length];
        }

        return { fill: fillColor, stroke: strokeColor, strokeWidth: isSelectedForActiveRef ? 3 : 2};
    };
    
    const handleMouseOver = (e: React.MouseEvent<SVGElement>, part: BodyPart) => {
        const tip = t(`tooltip.bodyPart.${part}` as TranslationKey, language);
        if (tip && svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            setTooltip({ text: tip, x: e.clientX - rect.left, y: e.clientY - rect.top - 30 });
        }
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const partsData = [
        { part: BodyPart.Hair, shape: 'path' as const, key: 'hair', props: { d: "M 55 15 C 40 10, 40 50, 55 55 L 75 55 L 95 55 C 110 50, 110 10, 95 15 Z" }},
        { part: BodyPart.Face, shape: 'rect' as const, key: 'face', props: { x: 60, y: 25, width: 30, height: 25, rx: 5 }},
        { part: BodyPart.Body, shape: 'path' as const, key: 'body', props: { d: "M 45 65 C 45 55, 105 55, 105 65 L 95 150 H 55 Z" }},
        { part: BodyPart.Pelvis, shape: 'rect' as const, key: 'pelvis', props: { x: 50, y: 155, width: 50, height: 25, rx: 5 }},
        { part: BodyPart.LeftShoulder, shape: 'circle' as const, key: 'l-shoulder', props: { cx: 35, cy: 75, r: 12 }},
        { part: BodyPart.LeftArm, shape: 'rect' as const, key: 'l-arm', props: { x: 27, y: 90, width: 16, height: 70, rx: 8 }},
        { part: BodyPart.LeftHand, shape: 'rect' as const, key: 'l-hand', props: { x: 22, y: 165, width: 26, height: 20, rx: 10 }},
        { part: BodyPart.RightShoulder, shape: 'circle' as const, key: 'r-shoulder', props: { cx: 115, cy: 75, r: 12 }},
        { part: BodyPart.RightArm, shape: 'rect' as const, key: 'r-arm', props: { x: 107, y: 90, width: 16, height: 70, rx: 8 }},
        { part: BodyPart.RightHand, shape: 'rect' as const, key: 'r-hand', props: { x: 102, y: 165, width: 26, height: 20, rx: 10 }},
        { part: BodyPart.LeftLeg, shape: 'rect' as const, key: 'l-leg', props: { x: 50, y: 185, width: 20, height: 100, rx: 10 }},
        { part: BodyPart.LeftFoot, shape: 'path' as const, key: 'l-foot', props: { d: "M45 290 H 70 L 75 305 H 40 Z" }},
        { part: BodyPart.RightLeg, shape: 'rect' as const, key: 'r-leg', props: { x: 80, y: 185, width: 20, height: 100, rx: 10 }},
        { part: BodyPart.RightFoot, shape: 'path' as const, key: 'r-foot', props: { d: "M75 290 H 100 L 105 305 H 70 Z" }},
    ];
    
    return (
        <div className="relative flex flex-col items-center w-full h-full">
            {tooltip && (
                <div 
                    className="absolute w-max max-w-xs bg-neutral-900 text-zinc-200 text-sm rounded-md py-2 px-4 pointer-events-none z-50 shadow-lg whitespace-pre-wrap border border-neutral-700"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)', opacity: 1 }}
                >
                    {tooltip.text}
                </div>
            )}
            <div className="flex-grow w-full flex items-center justify-center">
                <svg ref={svgRef} viewBox="0 0 150 345" className="w-36" onMouseLeave={handleMouseLeave}>
                    <g className="hover:[&>*]:stroke-white hover:[&>*]:fill-white/20">
                        {partsData.map(data => {
                            const ShapeComponent = data.shape;
                            return (
                                <ShapeComponent
                                    key={data.key}
                                    {...data.props}
                                    onClick={() => onAssign(data.part)}
                                    className={"transition-all duration-200 cursor-pointer"}
                                    style={getPartStyle(data.part)}
                                    onMouseOver={(e: React.MouseEvent<SVGElement>) => handleMouseOver(e, data.part)}
                                />
                            );
                        })}
                    </g>
                </svg>
            </div>
        </div>
    );
};

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
const ViewportControl: React.FC<{
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !isActive) return;
    didDrag.current = true;
    
    const deltaX = e.clientX - startClientPos.current.x;
    const deltaY = e.clientY - startClientPos.current.y;
    const sensitivity = 0.4;

    const newYaw = startValue.current.yaw + deltaX * sensitivity;
    let newPitch = startValue.current.pitch - deltaY * sensitivity;

    newPitch = Math.max(-90, Math.min(90, newPitch));
    
    const snappedPitch = findClosest(newPitch, PITCH_SNAP_POINTS);
    const snappedYaw = findClosestCircular(newYaw, YAW_SNAP_POINTS);

    if (snappedYaw !== value.yaw || snappedPitch !== value.pitch) {
      onChange({ yaw: snappedYaw, pitch: snappedPitch });
    }
    
  }, [onChange, value.yaw, value.pitch, isActive]);
  
  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
        if (!didDrag.current) {
            // Click logic
            if (isActive && onDeactivate) onDeactivate();
            else if (!isActive && onActivate) onActivate();
        }
    }
    
    isDragging.current = false;
    setIsTransitioning(true);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [isActive, onActivate, onDeactivate, handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    didDrag.current = false;
    setIsTransitioning(false);
    
    startClientPos.current = { x: e.clientX, y: e.clientY };
    startValue.current = { yaw: value.yaw, pitch: value.pitch };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp, value.yaw, value.pitch]);

  return (
    <Tooltip tip={tooltipText} position="bottom">
        <div 
            className={`p-4 ${!isActive ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} flex justify-center items-center`}
            onMouseDown={handleMouseDown}
        >
        <div className="w-32 h-32" style={{ perspective: '800px' }}>
            <div
            className="w-full h-full relative pointer-events-none"
            style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotation.pitch}deg) rotateY(${rotation.yaw}deg)`,
                transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
            }}
            >
            {[
                { face: 'front', transform: 'rotateY(0deg) translateZ(4rem)' },
                { face: 'back', transform: 'rotateY(180deg) translateZ(4rem)' },
                { face: 'right', transform: 'rotateY(90deg) translateZ(4rem)' },
                { face: 'left', transform: 'rotateY(-90deg) translateZ(4rem)' },
                { face: 'top', transform: 'rotateX(90deg) translateZ(4rem)' },
                { face: 'bottom', transform: 'rotateX(-90deg) translateZ(4rem)' },
            ].map(({ face, transform }) => (
                <div key={face} className={`absolute inset-0 flex items-center justify-center select-none text-sm font-bold ${isActive ? (cubeFaceClassName || 'bg-neutral-700/80 border border-neutral-500/50') : (inactiveCubeFaceClassName || 'bg-neutral-700/50 border border-neutral-600/50')}`} style={{ transform }}>
                    {t(`viewport.${face}` as TranslationKey, language)}
                </div>
            ))}
            </div>
        </div>
        </div>
    </Tooltip>
  );
};

const LightingDirectionSelector: React.FC<{
  currentDirection: { yaw: number, pitch: number };
  onSetDirection: (view: { yaw: number; pitch: number }) => void;
  language: Language;
  isLightDirectionActive: boolean;
}> = ({ currentDirection, onSetDirection, language, isLightDirectionActive }) => {
    
    const directionPoints = [
        { name: 'FrontLeft', yaw: 45, pitch: 0 },
        { name: 'Front', yaw: 0, pitch: 0 },
        { name: 'FrontRight', yaw: 315, pitch: 0 },
        { name: 'Left', yaw: 90, pitch: 0 },
        null,
        { name: 'Right', yaw: 270, pitch: 0 },
        { name: 'BackLeft', yaw: 135, pitch: 0 },
        { name: 'Back', yaw: 180, pitch: 0 },
        { name: 'BackRight', yaw: 225, pitch: 0 },
    ];

    const isDirectionSelected = (direction: { yaw: number, pitch: number } | null) => {
        if (!direction) return false;
        
        const currentYaw = (Math.round(currentDirection.yaw) % 360 + 360) % 360;
        const directionYaw = (Math.round(direction.yaw) % 360 + 360) % 360;
        
        const yawDiff = Math.min(Math.abs(currentYaw - directionYaw), 360 - Math.abs(currentYaw - directionYaw));
        const pitchDiff = Math.abs(Math.round(currentDirection.pitch) - Math.round(direction.pitch));

        return yawDiff < 1 && pitchDiff < 1;
    };

  return (
    <div className="flex justify-center">
        <div className="inline-block p-2 border rounded-lg border-white/10 bg-black/20">
          <div className="grid grid-cols-3 gap-2">
            {directionPoints.map((direction, index) => {
              if (!direction) {
                return (
                  <div key={index} className={`w-14 h-14 flex items-center justify-center bg-white/5 rounded-md transition-colors ${isLightDirectionActive ? 'text-yellow-500' : 'text-zinc-600'}`}>
                      <LightIcon className="w-8 h-8"/>
                  </div>
                );
              }
              const isSelected = isLightDirectionActive && isDirectionSelected(direction);
              const baseClass = 'w-14 h-14 rounded-md transition-colors';
              const activeClass = isSelected ? 'bg-amber-600' : (isLightDirectionActive ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 hover:bg-white/10');

              return (
                <Tooltip key={direction.name} tip={t(`lightingDirection.${direction.name}` as TranslationKey, language)} position="top">
                  <button
                    onClick={() => onSetDirection({ yaw: direction.yaw, pitch: direction.pitch })}
                    aria-label={t(`lightingDirection.${direction.name}` as TranslationKey, language)}
                    className={`${baseClass} ${activeClass}`}
                  >
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>
    </div>
  );
};

const CameraViewSelector: React.FC<{
  currentView: { yaw: number, pitch: number };
  onSetView: (view: { yaw: number; pitch: number }) => void;
  language: Language;
  isCameraViewActive: boolean;
}> = ({ currentView, onSetView, language, isCameraViewActive }) => {
    
    const viewPoints = [
        { name: 'FrontLeft', yaw: 45, pitch: 0 },
        { name: 'Front', yaw: 0, pitch: 0 },
        { name: 'FrontRight', yaw: 315, pitch: 0 },
        { name: 'Left', yaw: 90, pitch: 0 },
        null,
        { name: 'Right', yaw: 270, pitch: 0 },
        { name: 'BackLeft', yaw: 135, pitch: 0 },
        { name: 'Back', yaw: 180, pitch: 0 },
        { name: 'BackRight', yaw: 225, pitch: 0 },
    ];

    const isViewActive = (view: { yaw: number, pitch: number } | null) => {
        if (!view) return false;
        const currentYaw = (Math.round(currentView.yaw) % 360 + 360) % 360;
        const viewYaw = (Math.round(view.yaw) % 360 + 360) % 360;
        
        const yawDiff = Math.min(Math.abs(currentYaw - viewYaw), 360 - Math.abs(currentYaw - viewYaw));
        const pitchDiff = Math.abs(Math.round(currentView.pitch) - Math.round(view.pitch));

        return yawDiff < 1 && pitchDiff < 1;
    };

  return (
    <div className="flex justify-center">
        <div className="inline-block p-2 border rounded-lg border-white/10 bg-black/20">
          <div className="grid grid-cols-3 gap-2">
            {viewPoints.map((view, index) => {
              if (!view) {
                return (
                  <div key={index} className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-md text-zinc-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                  </div>
                );
              }
              const isSelected = isCameraViewActive && isViewActive(view);
              const baseClass = 'w-14 h-14 rounded-md transition-colors';
              const activeClass = isSelected ? 'bg-sky-500 text-white' : (isCameraViewActive ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 hover:bg-white/10');
              
              return (
                <Tooltip key={view.name} tip={t(`cameraAngle.${view.name}` as TranslationKey, language)} position="top">
                  <button
                    onClick={() => onSetView({ yaw: view.yaw, pitch: view.pitch })}
                    aria-label={t(`cameraAngle.${view.name}` as TranslationKey, language)}
                    className={`${baseClass} ${activeClass}`}
                  >
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>
    </div>
  );
};

interface DrawingCanvasProps {
  onDrawEnd: (file: File | null) => void;
  language: Language;
}
const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawEnd, language }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawBrushSize, setDrawBrushSize] = useState(5);
    const [eraseBrushSize, setEraseBrushSize] = useState(20);
    const [tool, setTool] = useState<'draw' | 'erase'>('draw');
    
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isCursorVisible, setIsCursorVisible] = useState(false);
    const [currentDynamicBrushSize, setCurrentDynamicBrushSize] = useState(5);

    const currentBrushSize = useMemo(() => (tool === 'draw' ? drawBrushSize : eraseBrushSize), [tool, drawBrushSize, eraseBrushSize]);
    const setCurrentBrushSize = useCallback((value: React.SetStateAction<number>) => {
        if (tool === 'draw') {
            setDrawBrushSize(value);
        } else {
            setEraseBrushSize(value);
        }
    }, [tool]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            setCtx(context);
            // Save initial state
            setHistory([canvas.toDataURL()]);
            setHistoryIndex(0);
        }
    }, []);

    useEffect(() => {
        if (!ctx) return;
        ctx.lineWidth = currentBrushSize;
        ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = '#FFFFFF';
        setCurrentDynamicBrushSize(currentBrushSize);
    }, [currentBrushSize, tool, ctx]);

    const saveState = useCallback(() => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, url]);
        setHistoryIndex(newHistory.length);
    }, [history, historyIndex]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const img = new Image();
            img.src = history[newIndex];
            img.onload = () => {
                ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx?.drawImage(img, 0, 0);
            };
        }
    }, [history, historyIndex, ctx]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const img = new Image();
            img.src = history[newIndex];
            img.onload = () => {
                ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx?.drawImage(img, 0, 0);
            };
        }
    }, [history, historyIndex, ctx]);

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!ctx) return;
        const { offsetX, offsetY } = e.nativeEvent;
        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const finishDrawing = () => {
        if (!ctx || !isDrawing) return;
        setIsDrawing(false);
        ctx.closePath();
        saveState();
        if (canvasRef.current) {
            canvasRef.current.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], "pose-drawing.png", { type: "image/png" });
                    onDrawEnd(file);
                }
            });
        }
    };
    
    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !ctx) return;
        const { offsetX, offsetY } = e.nativeEvent;

        let dynamicBrushSize = currentBrushSize;
        if (e.pointerType === 'pen') {
            const pressure = e.nativeEvent.pressure;
            dynamicBrushSize = Math.max(0.1, currentBrushSize * Math.pow(pressure, 2));
        }
        
        ctx.lineWidth = dynamicBrushSize;
        setCurrentDynamicBrushSize(dynamicBrushSize);

        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };
    
    const handleCursorMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        setCursorPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        
        if (e.pointerType === 'pen' && e.buttons > 0) { // Drawing with pen
            const pressure = e.pressure;
            setCurrentDynamicBrushSize(Math.max(0.1, currentBrushSize * Math.pow(pressure, 2)));
        } else {
            setCurrentDynamicBrushSize(currentBrushSize);
        }
    };

    const clearCanvas = () => {
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            saveState();
            onDrawEnd(null);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
            else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); handleRedo(); }
            else if (e.key === 'b') { e.preventDefault(); setTool('draw'); }
            else if (e.key === 'e') { e.preventDefault(); setTool('erase'); }
            else if (e.key === 'c') { e.preventDefault(); setCurrentBrushSize(prev => Math.min(100, prev + 5)); }
            else if (e.key === 'x') { e.preventDefault(); setCurrentBrushSize(prev => Math.max(0.5, prev - 5)); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, clearCanvas, setCurrentBrushSize]);


    const handleResetBrushSize = () => {
        if (tool === 'draw') {
            setDrawBrushSize(5);
        } else {
            setEraseBrushSize(20);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="relative"
                onPointerEnter={() => setIsCursorVisible(true)}
                onPointerLeave={() => setIsCursorVisible(false)}
                onPointerMove={handleCursorMove}
            >
                <canvas
                    ref={canvasRef}
                    onPointerDown={startDrawing}
                    onPointerUp={finishDrawing}
                    onPointerMove={draw}
                    onPointerLeave={finishDrawing}
                    width={360}
                    height={480}
                    className="bg-neutral-900 rounded-md border border-neutral-700 touch-none cursor-none"
                />
                {isCursorVisible && (
                    <div
                        className="absolute bg-transparent border border-white/80 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: cursorPos.x,
                            top: cursorPos.y,
                            width: currentDynamicBrushSize,
                            height: currentDynamicBrushSize,
                            transition: 'width 0.05s ease-out, height 0.05s ease-out',
                        }}
                    />
                )}
            </div>
            <div className="w-full bg-black/20 border border-white/10 p-2 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 flex-grow">
                        <Tooltip tip={`${t('drawing.draw', language)} (B)`} position="bottom" className="flex-1"><button onClick={() => setTool('draw')} className={`w-full py-2.5 rounded-md text-sm font-semibold ${tool === 'draw' ? 'bg-white text-zinc-800' : 'bg-white/10 hover:bg-white/20 text-zinc-200'}`}>{t('drawing.draw', language)}</button></Tooltip>
                        <Tooltip tip={`${t('drawing.erase', language)} (E)`} position="bottom" className="flex-1"><button onClick={() => setTool('erase')} className={`w-full py-2.5 rounded-md text-sm font-semibold ${tool === 'erase' ? 'bg-white text-zinc-800' : 'bg-white/10 hover:bg-white/20 text-zinc-200'}`}>{t('drawing.erase', language)}</button></Tooltip>
                        <Tooltip tip={`${t('drawing.clear', language)}`} position="bottom" className="flex-1"><button onClick={clearCanvas} className="w-full py-2.5 rounded-md text-sm font-semibold bg-red-600 hover:bg-red-500 text-white">{t('drawing.clear', language)}</button></Tooltip>
                    </div>
                    <div className="flex items-center gap-1 pl-2 ml-2 border-l border-white/10">
                        <Tooltip tip={`${t('drawing.undo', language)} (Ctrl+Z)`} position="bottom"><button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 rounded-md text-zinc-200 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"><UndoIcon/></button></Tooltip>
                        <Tooltip tip={`${t('drawing.redo', language)}`} position="bottom"><button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-md text-zinc-200 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"><RedoIcon/></button></Tooltip>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="brush-size" className="text-sm text-zinc-300 whitespace-nowrap">{t('drawing.brushSize', language)}</label>
                    <Tooltip tip={`${t('drawing.decreaseBrush', language)} / ${t('drawing.increaseBrush', language)}`} position="top" className="w-full">
                      <input id="brush-size" type="range" min="0.5" max="100" step="0.1" value={currentBrushSize} onChange={e => setCurrentBrushSize(parseFloat(e.target.value))} className="w-full" />
                    </Tooltip>
                    <Tooltip tip={t('drawing.resetBrush', language)} position="top">
                        <button onClick={handleResetBrushSize} className="p-1 rounded-full text-zinc-400 hover:bg-white/20 hover:text-white transition-colors">
                            <ResetIcon />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};


interface RightPanelProps {
    language: Language;
    onNotification: (message: string, type: 'success' | 'error') => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ language, onNotification }) => {
    const [activeRightPanelTab, setActiveRightPanelTab] = useState<RightPanelTab>('concept');
    const {
        cameraView, setCameraView, isCameraViewActive, setIsCameraViewActive,
        lightDirection, setLightDirection, lightIntensity, setLightIntensity,
        isLightDirectionActive, setIsLightDirectionActive, useAposeForViews, setUseAposeForViews,
        bodyPartReferenceMap, setBodyPartReferenceMap, selectedClothingConcept, setSelectedClothingConcept,
        selectedObjectItems, setSelectedObjectItems, poseControlImage, setPoseControlImage,
        selectedActionPose, setSelectedActionPose, isApplyingFullOutfit, isApplyingTop, isApplyingBottom,
        updateDerivedOutfitState
    } = useGenerationStore();

    const { activeReferenceIndex, setSelectedImageIds } = useCanvasStore();
    const referenceImages = useCanvasStore(state => state.boardImages.filter(img => img.role === 'reference').sort((a, b) => (a.refIndex ?? Infinity) - (b.refIndex ?? Infinity)));

    const [activeConceptTheme, setActiveConceptTheme] = useState<ConceptThemeKey>('fantasy');
    const [activeConceptSubTab, setActiveConceptSubTab] = useState<ConceptSubTabKey>('clothing');
    const activeRefColor = activeReferenceIndex !== null ? REF_COLORS[activeReferenceIndex % REF_COLORS.length] : null;

    useEffect(() => {
        updateDerivedOutfitState(bodyPartReferenceMap, activeReferenceIndex);
    }, [bodyPartReferenceMap, activeReferenceIndex, updateDerivedOutfitState]);

    const activateConceptMode = useCallback(() => {
        if (selectedActionPose) setSelectedActionPose(null);
        if (poseControlImage) setPoseControlImage(null);
    }, [selectedActionPose, poseControlImage, setSelectedActionPose, setPoseControlImage]);

    const handleBodyPartAssign = (part: BodyPart) => {
      activateConceptMode();
      if (activeReferenceIndex === null) { onNotification(t('tooltip.uploadReferenceFirst', language), 'error'); return; }
      if (selectedClothingConcept) setSelectedClothingConcept(null);
      setBodyPartReferenceMap(prevMap => {
          const newMap = { ...prevMap };
          if (newMap[part] === activeReferenceIndex) delete newMap[part];
          else newMap[part] = activeReferenceIndex;
          return newMap;
      });
    };

    const handleClothingItemToggle = (itemToToggle: ClothingItem) => {
        activateConceptMode(); setSelectedObjectItems([]);
        const isCurrentlySelected = selectedClothingConcept === itemToToggle;
        const newConcept = isCurrentlySelected ? null : itemToToggle;
        setSelectedClothingConcept(newConcept);
        let refIndexToUse = activeReferenceIndex;
        if (newConcept && refIndexToUse === null) {
          if (referenceImages.length > 0) { refIndexToUse = 0; setSelectedImageIds(prev => new Set([referenceImages[0].id])); }
          else { onNotification(t('error.modificationRequiresReference', language), 'error'); setSelectedClothingConcept(null); return; }
        }
        if (refIndexToUse === null) return;
        const finalRefIndex = refIndexToUse;
        setBodyPartReferenceMap(prevMap => {
            const newMap = { ...prevMap };
            const categoryOfItemToToggle = CLOTHING_ITEM_TO_CATEGORY_MAP[itemToToggle];
            const conflictingItems: ClothingItem[] = [];
            Object.values(ClothingItem).forEach(item => { const category = CLOTHING_ITEM_TO_CATEGORY_MAP[item]; if (category === categoryOfItemToToggle || category === 'sets' || categoryOfItemToToggle === 'sets') conflictingItems.push(item); });
            conflictingItems.forEach(item => { const partsToClear = CLOTHING_TO_BODY_PARTS_MAP[item] || []; partsToClear.forEach(part => { if (newMap[part] === finalRefIndex) delete newMap[part]; }); });
            if (newConcept) { const partsForItem = CLOTHING_TO_BODY_PARTS_MAP[itemToToggle] || []; partsForItem.forEach(part => { newMap[part] = finalRefIndex!; }); }
            return newMap;
        });
    };

    const handleObjectItemToggle = (itemToToggle: ObjectItem) => {
        activateConceptMode(); setBodyPartReferenceMap({});
        setSelectedObjectItems(prev => {
            if (prev.includes(itemToToggle)) return [];
            setUseAposeForViews(false); return [itemToToggle];
        });
    };
    
    const handleApplyFullOutfitClick = () => {
        if (activeReferenceIndex === null) return;
        activateConceptMode();
        const shouldApply = !isApplyingFullOutfit;
        setBodyPartReferenceMap(prevMap => {
            const newMap = { ...prevMap };
            APPLY_FULL_OUTFIT_BODY_PARTS.forEach(part => {
                if (shouldApply) newMap[part] = activeReferenceIndex;
                else if (newMap[part] === activeReferenceIndex) delete newMap[part];
            });
            return newMap;
        });
        if (shouldApply) { setSelectedClothingConcept(null); setSelectedObjectItems([]); }
    };
    
    const handleApplyTopClick = () => {
        if (activeReferenceIndex === null) return;
        activateConceptMode();
        const shouldApply = !isApplyingTop;
        setBodyPartReferenceMap(prevMap => {
            const newMap = { ...prevMap };
            APPLY_TOP_BODY_PARTS.forEach(part => {
                if (shouldApply) newMap[part] = activeReferenceIndex;
                else if (newMap[part] === activeReferenceIndex) delete newMap[part];
            });
            if (shouldApply && isApplyingFullOutfit) APPLY_BOTTOM_BODY_PARTS.forEach(part => { if (newMap[part] === activeReferenceIndex) delete newMap[part]; });
            return newMap;
        });
        if (shouldApply) { setSelectedClothingConcept(null); setSelectedObjectItems([]); }
    };
    
    const handleApplyBottomClick = () => {
        if (activeReferenceIndex === null) return;
        activateConceptMode();
        const shouldApply = !isApplyingBottom;
        setBodyPartReferenceMap(prevMap => {
            const newMap = { ...prevMap };
            APPLY_BOTTOM_BODY_PARTS.forEach(part => {
                if (shouldApply) newMap[part] = activeReferenceIndex;
                else if (newMap[part] === activeReferenceIndex) delete newMap[part];
            });
            if (shouldApply && isApplyingFullOutfit) APPLY_TOP_BODY_PARTS.forEach(part => { if (newMap[part] === activeReferenceIndex) delete newMap[part]; });
            return newMap;
        });
        if (shouldApply) { setSelectedClothingConcept(null); setSelectedObjectItems([]); }
    };

    const handleCameraViewChange = useCallback((newView: Omit<SelectedView, 'size' | 'fov'>) => {
        setCameraView(prev => ({ ...prev, ...newView }));
        setIsCameraViewActive(true);
    }, [setCameraView, setIsCameraViewActive]);
  
    const handleCameraPresetChange = useCallback(({yaw, pitch}: { yaw: number, pitch: number }) => {
        const isCurrentlyActiveAndSelected = isCameraViewActive &&
            ((Math.round(cameraView.yaw) % 360 + 360) % 360 === (Math.round(yaw) % 360 + 360) % 360) &&
            Math.round(cameraView.pitch) === Math.round(pitch);
        if (isCurrentlyActiveAndSelected) setIsCameraViewActive(false);
        else { setCameraView(prev => ({...prev, yaw, pitch})); setIsCameraViewActive(true); }
    }, [cameraView, isCameraViewActive, setCameraView, setIsCameraViewActive]);
    
    const handleLightDirectionChange = useCallback((newDirection: { yaw: number, pitch: number }) => {
        setLightDirection(newDirection);
        setIsLightDirectionActive(true);
    }, [setLightDirection, setIsLightDirectionActive]);
  
    const handleLightPresetChange = useCallback(({yaw, pitch}: { yaw: number, pitch: number }) => {
        const isCurrentlyActiveAndSelected = isLightDirectionActive &&
            ((Math.round(lightDirection.yaw) % 360 + 360) % 360 === (Math.round(yaw) % 360 + 360) % 360) &&
            Math.round(lightDirection.pitch) === Math.round(pitch);
        if (isCurrentlyActiveAndSelected) setIsLightDirectionActive(false);
        else { setLightDirection({yaw, pitch}); setIsLightDirectionActive(true); }
    }, [isLightDirectionActive, lightDirection, setLightDirection, setIsLightDirectionActive]);

    const conceptSelectionIsEmpty = Object.keys(bodyPartReferenceMap).length === 0 && selectedObjectItems.length === 0 && selectedClothingConcept === null;
    const conceptDeselectButton = (<Tooltip tip={t('tooltip.clearConceptSelection', language)} position="left"><button onClick={() => { setSelectedObjectItems([]); setBodyPartReferenceMap({}); setSelectedClothingConcept(null); }} disabled={conceptSelectionIsEmpty} className="px-3 py-1.5 text-xs font-semibold text-zinc-200 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('clearSelection', language)}</button></Tooltip>);
    const activeClothingThemeData = CLOTHING_THEMES.find(theme => theme.themeKey === activeConceptTheme);
    const activeObjectThemeData = OBJECT_THEMES.find(theme => theme.themeKey === activeConceptTheme);

    const conceptThemeTabs: { key: ConceptThemeKey; labelKey: TranslationKey }[] = [
        { key: 'scifi', labelKey: 'theme.scifi' }, { key: 'fantasy', labelKey: 'theme.fantasy' }, { key: 'modern', labelKey: 'theme.modern' },
    ];


    return (
        <>
            <div className="flex-shrink-0 p-2 bg-black/20 border-b border-white/10">
                <div className="flex items-center bg-black/20 rounded-lg p-1">
                    <Tooltip tip={t('tooltip.section.conceptDesign', language)} position="bottom" className="flex-1">
                        <button onClick={() => setActiveRightPanelTab('concept')} className={`w-full py-2 rounded-md transition-colors flex justify-center items-center ${activeRightPanelTab === 'concept' ? 'bg-white text-zinc-800' : 'text-zinc-300 hover:bg-white/10'}`}>
                            <PaletteIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip tip={t('rightPanelTab.camera', language)} position="bottom" className="flex-1">
                        <button onClick={() => setActiveRightPanelTab('camera')} className={`w-full py-2 rounded-md transition-colors flex justify-center items-center ${activeRightPanelTab === 'camera' ? 'bg-white text-zinc-800' : 'text-zinc-300 hover:bg-white/10'}`}>
                            <CameraIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip tip={t('tooltip.poseControl', language)} position="bottom" className="flex-1">
                        <button onClick={() => setActiveRightPanelTab('pose')} className={`w-full py-2 rounded-md transition-colors flex justify-center items-center ${activeRightPanelTab === 'pose' ? 'bg-white text-zinc-800' : 'text-zinc-300 hover:bg-white/10'}`}>
                            <BodyIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div className="p-4 space-y-4">
              {activeRightPanelTab === 'concept' && (<>
                  <Section title={t('section.bodyPartSelection.title', language)} tooltipText={t('tooltip.bodyPartConcept', language)} icon={<BodyIcon/>} topRightAction={<div className="flex items-center gap-2"><Tooltip tip={t('tooltip.deselectAllBodyParts', language)} position="left"><button onClick={() => setBodyPartReferenceMap({})} disabled={Object.keys(bodyPartReferenceMap).length === 0} className="px-3 py-1.5 text-xs font-semibold text-zinc-200 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('clearSelection', language)}</button></Tooltip></div>}>
                      <div className="flex items-start gap-4 h-[350px]">
                          <div className="w-1/2 h-full flex items-center justify-center"><BodyPartSelector bodyPartReferenceMap={bodyPartReferenceMap} onAssign={handleBodyPartAssign} language={language}/></div>
                          <div className="w-px h-full bg-white/10"></div>
                          <div className="w-1/2 flex flex-col items-center gap-3">
                              <p className="text-xs text-zinc-400 text-center">선택한 참조 이미지의 의상을 특정 부위에 적용해보세요.</p>
                              <div className="w-full space-y-2">
                                  <Tooltip tip={t('tooltip.applyFullOutfit', language)} position="bottom" className="w-full"><button onClick={handleApplyFullOutfitClick} disabled={activeReferenceIndex === null} className={`w-full py-2.5 text-sm font-semibold rounded-md transition-colors ${isApplyingFullOutfit ? 'bg-white text-zinc-800' : 'bg-white/10 text-zinc-200 hover:bg-white/20'} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('applyFullOutfit', language)}</button></Tooltip>
                                  <Tooltip tip={t('tooltip.applyTop', language)} position="bottom" className="w-full"><button onClick={handleApplyTopClick} disabled={activeReferenceIndex === null} className={`w-full py-2.5 text-sm font-semibold rounded-md transition-colors ${isApplyingTop ? 'bg-white text-zinc-800' : 'bg-white/10 text-zinc-200 hover:bg-white/20'} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('applyTop', language)}</button></Tooltip>
                                  <Tooltip tip={t('tooltip.applyBottom', language)} position="bottom" className="w-full"><button onClick={handleApplyBottomClick} disabled={activeReferenceIndex === null} className={`w-full py-2.5 text-sm font-semibold rounded-md transition-colors ${isApplyingBottom ? 'bg-white text-zinc-800' : 'bg-white/10 text-zinc-200 hover:bg-white/20'} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('applyBottom', language)}</button></Tooltip>
                              </div>
                              {activeReferenceIndex !== null && (<div className="flex items-center gap-2 p-2 rounded-md text-sm" style={{ backgroundColor: activeRefColor ? `${activeRefColor}30` : 'transparent', border: `1px solid ${activeRefColor || 'transparent'}`}}><div className="w-4 h-4 rounded-full" style={{backgroundColor: activeRefColor || '#FFF'}}></div><span className="font-semibold" style={{color: activeRefColor || '#FFF'}}>참조 {activeReferenceIndex + 1}</span><span className="text-zinc-300">수정 중...</span></div>)}
                          </div>
                      </div>
                  </Section>
                  <Section title={t('section.conceptDesign.title', language)} tooltipText={t('tooltip.section.conceptDesign', language)} icon={<PaletteIcon/>} topRightAction={conceptDeselectButton}>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">{conceptThemeTabs.map(tab => (<Tooltip key={tab.key} tip={t('tooltip.clothingTheme', language)} position="bottom" className="flex-1"><button onClick={() => setActiveConceptTheme(tab.key)} className={`w-full py-2.5 rounded-md text-sm font-semibold transition-colors ${activeConceptTheme === tab.key ? 'bg-white text-zinc-800' : 'bg-white/10 hover:bg-white/20 text-zinc-200'}`}>{t(tab.labelKey, language)}</button></Tooltip>))}</div>
                      <div className="flex bg-black/20 rounded-md p-1">
                        <Tooltip tip={t('tooltip.subTabClothing', language)} position="bottom" className="flex-1"><button onClick={() => setActiveConceptSubTab('clothing')} className={`w-full py-2 rounded-md text-xs font-semibold ${activeConceptSubTab === 'clothing' ? 'bg-neutral-700 text-white' : 'text-zinc-400 hover:bg-neutral-700/50'}`}>{t('subTab.clothingConcept', language)}</button></Tooltip>
                        <Tooltip tip={t('tooltip.subTabItem', language)} position="bottom" className="flex-1"><button onClick={() => setActiveConceptSubTab('item')} className={`w-full py-2 rounded-md text-xs font-semibold ${activeConceptSubTab === 'item' ? 'bg-neutral-700 text-white' : 'text-zinc-400 hover:bg-neutral-700/50'}`}>{t('subTab.itemConcept', language)}</button></Tooltip>
                      </div>
                      {activeConceptSubTab === 'clothing' && activeClothingThemeData && (<div className="space-y-3 animate-category-fade-in">{activeClothingThemeData.categories.map(category => (<div key={category.categoryKey}><h3 className="text-sm font-semibold mb-2 text-zinc-300">{t(`clothingCategory.${category.categoryKey}` as TranslationKey, language)}</h3><div className="flex flex-wrap gap-2">{category.items.map(item => (<Tooltip key={item} tip={getEnumText('clothing', item, language)} position="top" className="flex-grow"><button onClick={() => handleClothingItemToggle(item)} className={`px-3 py-1.5 text-xs rounded-md w-full transition-colors ${(selectedClothingConcept === item) ? 'bg-white text-zinc-800 font-semibold' : 'bg-white/10 hover:bg-white/20 text-zinc-300'}`}>{getEnumText('clothing', item, language)}</button></Tooltip>))}</div></div>))}</div>)}
                      {activeConceptSubTab === 'item' && activeObjectThemeData && (<div className="space-y-3 animate-category-fade-in">{activeObjectThemeData.categories.map(category => (<div key={category.categoryKey}><h3 className="text-sm font-semibold mb-2 text-zinc-300">{t(`objectCategory.${category.categoryKey}` as TranslationKey, language)}</h3><div className="flex flex-wrap gap-2">{category.items.map(item => (<Tooltip key={item} tip={getEnumText('object', item, language)} position="top" className="flex-grow"><button onClick={() => handleObjectItemToggle(item)} className={`px-3 py-1.5 text-xs rounded-md w-full transition-colors ${selectedObjectItems.includes(item) ? 'bg-white text-zinc-800 font-semibold' : 'bg-white/10 hover:bg-white/20 text-zinc-300'}`}>{getEnumText('object', item, language)}</button></Tooltip>))}</div></div>))}</div>)}
                    </div>
                  </Section></>)}
              {activeRightPanelTab === 'camera' && (<>
                  <Section title={t('section.cameraView.title', language)} tooltipText={t('tooltip.section.cameraView', language)} icon={<CameraIcon/>}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex flex-col items-center gap-4">
                        <ViewportControl value={cameraView} onChange={handleCameraViewChange} language={language} isActive={isCameraViewActive} onActivate={() => setIsCameraViewActive(true)} onDeactivate={() => setIsCameraViewActive(false)} tooltipText={t('tooltip.viewportControl', language)} cubeFaceClassName="bg-sky-500/80 border border-sky-400/50"/>
                        <CameraViewSelector currentView={cameraView} onSetView={handleCameraPresetChange} language={language} isCameraViewActive={isCameraViewActive}/>
                      </div>
                      <div className="w-full flex items-center gap-2"><label htmlFor="fov-slider" className="text-sm font-medium text-zinc-300">FOV</label><Tooltip tip={t('tooltip.fovSlider', language)} position="top" className="w-full"><input id="fov-slider" type="range" min="10" max="120" value={cameraView.fov} onChange={e => setCameraView(prev => ({ ...prev, fov: parseInt(e.target.value, 10) }))} className="w-full"/></Tooltip><span className="text-sm font-mono text-zinc-400 w-10 text-right">{cameraView.fov}°</span><Tooltip tip={t('tooltip.resetFov', language)} position="top"><button onClick={() => setCameraView(prev => ({ ...prev, fov: 50 }))} className="p-1.5 rounded-full text-zinc-400 hover:bg-white/20 hover:text-white transition-colors"><ResetIcon/></button></Tooltip></div>
                      <div className="w-full"><Tooltip tip={t('tooltip.aPose', language)} position="bottom"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={useAposeForViews} onChange={e => setUseAposeForViews(e.target.checked)} className="h-4 w-4 rounded bg-neutral-700 border-neutral-600 text-sky-500 focus:ring-sky-500" /><span className="text-sm text-zinc-300">{t('aPose', language)}</span></label></Tooltip></div>
                    </div>
                  </Section>
                  <Section title={t('section.lighting.title', language)} tooltipText={t('tooltip.lightingDirection', language)} icon={<LightIcon/>}>
                      <div className="flex flex-col items-center gap-4">
                          <div className="flex flex-col items-center gap-4">
                              <ViewportControl value={lightDirection} onChange={handleLightDirectionChange} language={language} isActive={isLightDirectionActive} onActivate={() => setIsLightDirectionActive(true)} onDeactivate={() => setIsLightDirectionActive(false)} tooltipText={t('tooltip.lightingDirection', language)} cubeFaceClassName="bg-amber-500/80 border border-amber-400/50"/>
                              <LightingDirectionSelector currentDirection={lightDirection} onSetDirection={handleLightPresetChange} language={language} isLightDirectionActive={isLightDirectionActive}/>
                          </div>
                          <div className="w-full flex items-center gap-2"><label htmlFor="light-intensity-slider" className="text-sm font-medium text-zinc-300">{t('section.lighting.intensity', language)}</label><Tooltip tip={t('tooltip.lightingIntensity', language)} position="top" className="w-full"><input id="light-intensity-slider" type="range" min="0.1" max="2.0" step="0.1" value={lightIntensity} onChange={e => setLightIntensity(parseFloat(e.target.value))} className="w-full"/></Tooltip><span className="text-sm font-mono text-zinc-400 w-12 text-right">{lightIntensity.toFixed(1)}</span><Tooltip tip={t('tooltip.resetLightIntensity', language)} position="top"><button onClick={() => setLightIntensity(1.0)} className="p-1.5 rounded-full text-zinc-400 hover:bg-white/20 hover:text-white transition-colors"><ResetIcon/></button></Tooltip></div>
                      </div>
                  </Section></>)}
              {activeRightPanelTab === 'pose' && (<div className="space-y-4 animate-category-fade-in"><Section title="포즈 그리기" tooltipText="스틱맨 형태로 포즈를 직접 그려보세요." icon={<PaletteIcon />}><DrawingCanvas onDrawEnd={setPoseControlImage} language={language} /></Section></div>)}
            </div>
        </>
    )
};