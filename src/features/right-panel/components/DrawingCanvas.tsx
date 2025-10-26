import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { t, Language } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';
import { UndoIcon, RedoIcon, ResetIcon } from '../../../components/icons';

interface DrawingCanvasProps {
  onDrawEnd: (file: File | null) => void;
  language: Language;
}
export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawEnd, language }) => {
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
                    width={240}
                    height={320}
                    className="bg-neutral-900 rounded-md border border-neutral-700 touch-none cursor-none w-[240px] h-[320px]"
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
                        <Tooltip tip={`${t('drawing.draw', language)} (B)`} position="bottom" className="flex-1"><button onClick={() => setTool('draw')} className={`w-full py-2 rounded-md text-xs font-semibold ${tool === 'draw' ? 'bg-white text-zinc-800' : 'bg-white/10 hover:bg-white/20 text-zinc-200'}`}>{t('drawing.draw', language)}</button></Tooltip>
                        <Tooltip tip={`${t('drawing.erase', language)} (E)`} position="bottom" className="flex-1"><button onClick={() => setTool('erase')} className={`w-full py-2 rounded-md text-xs font-semibold ${tool === 'erase' ? 'bg-white text-zinc-800' : 'bg-white/10 hover:bg-white/20 text-zinc-200'}`}>{t('drawing.erase', language)}</button></Tooltip>
                        <Tooltip tip={`${t('drawing.clear', language)}`} position="bottom" className="flex-1"><button onClick={clearCanvas} className="w-full py-2 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-500 text-white">{t('drawing.clear', language)}</button></Tooltip>
                    </div>
                    <div className="flex items-center gap-1 pl-2 ml-2 border-l border-white/10">
                        <Tooltip tip={`${t('drawing.undo', language)} (Ctrl+Z)`} position="bottom"><button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 rounded-md text-zinc-200 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"><UndoIcon/></button></Tooltip>
                        <Tooltip tip={`${t('drawing.redo', language)}`} position="bottom"><button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-md text-zinc-200 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"><RedoIcon/></button></Tooltip>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="brush-size" className="text-xs text-zinc-300 whitespace-nowrap">{t('drawing.brushSize', language)}</label>
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
