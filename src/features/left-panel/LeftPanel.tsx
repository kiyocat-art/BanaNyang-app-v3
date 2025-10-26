import React, { useState, useEffect, useRef } from 'react';
import { GeneratedMedia, GenerationTask, MonthlyCredit, GenerationParams } from '../../types';
import { t, Language, TranslationKey } from '../../localization';
import { Tooltip } from '../../components/Tooltip';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SettingsIcon, FolderIcon, CloseIcon, DownloadIcon, MagnifyIcon, CheckIcon, PencilIcon, SparklesIcon } from '../../components/icons';

interface LeftPanelProps {
    language: Language;
    monthlyCredit: MonthlyCredit;
    manualUsedCredit: number | '';
    onManualUsedCreditChange: (value: string) => void;
    onUpdateCredit: () => void;
    onCreditInputBlur: () => void;
    isProcessing: boolean;
    generationQueue: GenerationTask[];
    onCancelAll: () => void;
    onCancelSingleTask: (taskId: string) => void;
    allHistoryMedia: GeneratedMedia[];
    saveDirectoryHandle: FileSystemDirectoryHandle | null;
    onSelectSaveDirectory: () => void;
    onSetSaveDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void;
    selectedMediaIds: Set<string>;
    onSelectAllToggle: () => void;
    onDownloadSelectedMedia: () => void;
    onDeleteSelectedMedia: () => void;
    currentMedia: GeneratedMedia[];
    onHistoryDragStart: (e: React.DragEvent<HTMLElement>, media: GeneratedMedia) => void;
    onToggleMediaSelection: (id: string) => void;
    onZoomImage: (src: string) => void;
    onDownload: (e: React.MouseEvent, media: GeneratedMedia) => void;
    downloadStatus: Record<string, 'downloading' | 'success'>;
    downloadedImageIds: Set<string>;
    totalPages: number;
    currentPage: number;
    onSetCurrentPage: (page: number | ((prev: number) => number)) => void;
    leftPanelWidth: number;
    onUpdateTotalCredit: (newTotal: number) => void;
    onLoadGenerationParams: (params: GenerationParams) => void;
}

const getTaskSummary = (task: GenerationTask, lang: Language): string => {
    if (task.selectedActionPose) return t('taskSummary.imagePose', lang);
    if (task.selectedObjectItems.length > 0) return t('taskSummary.imageConcept', lang, { item: t(`object.${task.selectedObjectItems[0]}` as TranslationKey, lang) });
    if (task.cameraView) return t('taskSummary.imageViews', lang, { count: 1 });
    return t('taskSummary.imageEdit', lang);
};

export const LeftPanel: React.FC<LeftPanelProps> = ({
    language,
    monthlyCredit,
    manualUsedCredit,
    onManualUsedCreditChange,
    onUpdateCredit,
    onCreditInputBlur,
    isProcessing,
    generationQueue,
    onCancelAll,
    onCancelSingleTask,
    allHistoryMedia,
    saveDirectoryHandle,
    onSelectSaveDirectory,
    onSetSaveDirectoryHandle,
    selectedMediaIds,
    onSelectAllToggle,
    onDownloadSelectedMedia,
    onDeleteSelectedMedia,
    currentMedia,
    onHistoryDragStart,
    onToggleMediaSelection,
    onZoomImage,
    onDownload,
    downloadStatus,
    downloadedImageIds,
    totalPages,
    currentPage,
    onSetCurrentPage,
    leftPanelWidth,
    onUpdateTotalCredit,
    onLoadGenerationParams
}) => {

    const monthlyCreditPercentage = monthlyCredit.total > 0 ? Math.min(100, (monthlyCredit.current / monthlyCredit.total) * 100) : 0;
    const [isEditingTotalCredit, setIsEditingTotalCredit] = useState(false);
    const [totalCreditInput, setTotalCreditInput] = useState(monthlyCredit.total.toString());
    const totalCreditInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isEditingTotalCredit) {
            setTotalCreditInput(monthlyCredit.total.toString());
        }
    }, [monthlyCredit.total, isEditingTotalCredit]);

    useEffect(() => {
        if (isEditingTotalCredit) {
            totalCreditInputRef.current?.focus();
            totalCreditInputRef.current?.select();
        }
    }, [isEditingTotalCredit]);

    const handleTotalCreditUpdate = () => {
        const newTotal = parseInt(totalCreditInput, 10);
        if (!isNaN(newTotal) && newTotal >= 0) {
            onUpdateTotalCredit(newTotal);
        } else {
            setTotalCreditInput(monthlyCredit.total.toString());
        }
        setIsEditingTotalCredit(false);
    };


    return (
        <div className="flex flex-col flex-grow p-4 space-y-3 min-h-0">
            <style>{`
                @keyframes progress-animation {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .progress-bar-inner {
                    animation: progress-animation 15s linear forwards;
                }
            `}</style>
            <div className="flex-shrink-0 space-y-3">
                <div className="space-y-2">
                    <Tooltip tip={t('tooltip.monthlyCreditProgressBar', language)} className="w-full">
                        <div className="relative w-full bg-neutral-900/50 rounded-md h-5 overflow-hidden border border-white/10">
                            {/* White text on dark background */}
                            <div className="absolute inset-0 flex justify-between items-center px-3">
                                <span className="text-xs text-white font-bold tracking-wide">크레딧</span>
                                <span className="text-xs text-white font-bold font-mono">
                                    {monthlyCredit.current.toLocaleString()} / {' '}
                                    {isEditingTotalCredit ? (
                                        <input
                                            ref={totalCreditInputRef}
                                            type="text"
                                            value={totalCreditInput}
                                            onChange={(e) => setTotalCreditInput(e.target.value.replace(/[^0-9]/g, ''))}
                                            onBlur={handleTotalCreditUpdate}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTotalCreditUpdate()}
                                            className="w-20 bg-neutral-700 border border-neutral-500 rounded-md py-0 px-1 text-xs font-mono text-zinc-100 text-right outline-none"
                                        />
                                    ) : (
                                        <Tooltip tip={t('tooltip.editTotalCredit', language)} position="top">
                                            <button onClick={() => setIsEditingTotalCredit(true)} className="inline-flex items-center gap-1">
                                                {monthlyCredit.total.toLocaleString()}
                                                <PencilIcon className="w-3 h-3 text-zinc-400" />
                                            </button>
                                        </Tooltip>
                                    )}
                                </span>
                            </div>
                            {/* Progress bar with clipped black text */}
                            <div
                                className="absolute top-0 left-0 h-full bg-yellow-400 overflow-hidden"
                                style={{ width: `${monthlyCreditPercentage}%`, transition: 'width 0.5s ease-in-out' }}
                            >
                                <div className="h-full flex justify-between items-center px-3" style={{ width: `${Math.max(0, leftPanelWidth - 32)}px` }}>
                                    <span className="text-xs text-black font-bold tracking-wide">크레딧</span>
                                    <span className="text-xs text-black font-bold font-mono whitespace-nowrap">
                                        {monthlyCredit.current.toLocaleString()} / {monthlyCredit.total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip tip={t('tooltip.creditAdjustment', language)} className="w-full">
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor="used-credit-input" className="text-sm text-zinc-300 whitespace-nowrap">{t('creditAdjustment.usedAmount', language)}</label>
                            <div className="flex items-center gap-2">
                                <input id="used-credit-input" type="number" value={manualUsedCredit} onChange={(e) => onManualUsedCreditChange(e.target.value)} onBlur={onCreditInputBlur} className="w-24 bg-neutral-900 border border-neutral-600 rounded-md py-1 px-2 text-sm font-mono text-zinc-200 text-right focus:ring-1 focus:ring-white focus:border-white outline-none" />
                                <button onClick={onUpdateCredit} className="px-3 py-1 text-sm font-semibold text-zinc-800 bg-white hover:bg-zinc-200 rounded-md transition-colors">{t('creditAdjustment.updateButton', language)}</button>
                            </div>
                        </div>
                    </Tooltip>
                </div>
                <hr className="border-white/10" />
                {(isProcessing || generationQueue.length > 0) && (
                    <>
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-bold text-zinc-100">{t('queue.title', language)}</h3>
                            <button onClick={onCancelAll} className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors">{t('queue.cancelAll', language)}</button>
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {isProcessing && generationQueue.length > 0 && (
                                <div className="bg-neutral-900/50 p-2 rounded-md flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-zinc-200 truncate">{getTaskSummary(generationQueue[0], language)}</span>
                                        <span className="text-xs text-zinc-300 font-semibold">{t('queue.processing', language, { count: generationQueue.length -1 })}</span>
                                    </div>
                                    <div className="w-full bg-neutral-600 rounded-full h-1.5">
                                        <div className="bg-yellow-400 h-1.5 rounded-full progress-bar-inner"></div>
                                    </div>
                                </div>
                            )}
                            {generationQueue.slice(isProcessing ? 1 : 0).map((task) => (
                                <div key={task.id} className="bg-neutral-900/50 border border-white/10 p-2 rounded-md flex justify-between items-center">
                                    <span className="text-sm text-zinc-400 truncate">{getTaskSummary(task, language)}</span>
                                    <button onClick={() => onCancelSingleTask(task.id)} className="text-xs text-zinc-500 hover:text-white">&times; {t('queue.cancel', language)}</button>
                                </div>
                            ))}
                        </div>
                        <hr className="border-white/10" />
                    </>
                )}
            </div>
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex-shrink-0 mb-2 p-2 bg-neutral-900/50 border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-zinc-100">{t('section.history.title', language)}</h2>
                    <div className="flex items-center gap-2">
                        {saveDirectoryHandle ? (
                            <div className="flex items-center gap-2 text-xs bg-black/30 text-zinc-300 rounded-md p-1 pr-2 border border-white/10">
                                <FolderIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                                <Tooltip tip={saveDirectoryHandle.name} position='top'><span className="font-mono truncate max-w-[80px]" >{saveDirectoryHandle.name}</span></Tooltip>
                                <Tooltip tip={t('tooltip.unsetSaveDirectory', language)} position='top'><button onClick={() => onSetSaveDirectoryHandle(null)} className="p-1 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-white/20"><CloseIcon className="w-3 h-3" /></button></Tooltip>
                            </div>
                        ) : (
                            <Tooltip tip={t('tooltip.setSaveDirectory', language)} position='top'>
                                <button onClick={onSelectSaveDirectory} className="p-1.5 text-zinc-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-xs"><FolderIcon className="w-4 h-4" /></button>
                            </Tooltip>
                        )}
                        <div className="h-5 border-l border-white/10"></div>
                        {allHistoryMedia.length > 0 && (
                            <>
                                <Tooltip tip={t('tooltip.selectAllOnPage', language)} position="top"><button onClick={onSelectAllToggle} className="p-1.5 text-zinc-300 hover:text-white bg-white/10 border border-white/10 rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button></Tooltip>
                                <Tooltip tip={t('tooltip.downloadSelected', language, { count: selectedMediaIds.size })} position="top"><button onClick={onDownloadSelectedMedia} disabled={selectedMediaIds.size === 0} className="p-1.5 text-xs font-medium text-zinc-800 bg-white hover:bg-zinc-200 rounded-md transition-colors disabled:bg-neutral-700 disabled:text-zinc-500 disabled:cursor-not-allowed flex items-center gap-1"><DownloadIcon className="w-4 h-4" />({selectedMediaIds.size})</button></Tooltip>
                                <Tooltip tip={t('tooltip.removeSelected', language, { count: selectedMediaIds.size })} position="top"><button onClick={onDeleteSelectedMedia} disabled={selectedMediaIds.size === 0} className="p-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:bg-neutral-700 disabled:text-zinc-500 disabled:cursor-not-allowed flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>({selectedMediaIds.size})</button></Tooltip>
                            </>
                        )}
                    </div>
                </div>
                {allHistoryMedia.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-center text-zinc-500">
                        <p>{t('history.empty', language)}</p>
                    </div>
                ) : (
                    <div className="flex-grow pr-1 overflow-y-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {currentMedia.map((media, index) => (
                                <div key={media.id} draggable={media.type === 'image'} onDragStart={(e) => onHistoryDragStart(e, media)} className="relative group aspect-square" onClick={() => onToggleMediaSelection(media.id)}>
                                    <img src={media.src} alt={`Generated ${media.type} ${index}`} className="w-full h-full object-cover rounded-md bg-neutral-700" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                                        <div className="flex justify-end gap-1">
                                            {media.generationParams && (
                                                <Tooltip tip="프롬프트 불러오기" position="bottom">
                                                    <button onClick={(e) => { e.stopPropagation(); onLoadGenerationParams(media.generationParams!); }} className="p-1.5 bg-black/50 rounded-md text-white hover:bg-white/20 transition-colors">
                                                        <SparklesIcon className="w-4 h-4" />
                                                    </button>
                                                </Tooltip>
                                            )}
                                            <Tooltip tip={t('tooltip.zoomImage', language)} position="bottom"><button onClick={(e) => { e.stopPropagation(); onZoomImage(media.src); }} className="p-1.5 bg-black/50 rounded-md text-white hover:bg-white/20 transition-colors"><MagnifyIcon className="w-4 h-4" /></button></Tooltip>
                                            <Tooltip tip={downloadedImageIds.has(media.id) ? t('tooltip.downloadAgain', language) : (media.type === 'video' ? t('tooltip.downloadMp4', language) : t('tooltip.downloadImage', language))} position="bottom"><button onClick={(e) => onDownload(e, media)} className="p-1.5 bg-black/50 rounded-md text-white hover:bg-white/20 transition-colors">{downloadStatus[media.id] === 'downloading' ? <LoadingSpinner className="h-4 w-4" /> : <DownloadIcon className="w-4 h-4" />}</button></Tooltip>
                                        </div>
                                    </div>
                                    {selectedMediaIds.has(media.id) && (
                                        <div className="absolute inset-0 border-2 border-white rounded-md pointer-events-none">
                                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white text-zinc-800 rounded-full flex items-center justify-center"><CheckIcon /></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {totalPages > 1 && (
                    <div className="flex-shrink-0 flex justify-between items-center mt-2 p-2 bg-neutral-900/50 border border-white/10 rounded-xl">
                        <button onClick={() => onSetCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-xs font-semibold text-zinc-200 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50">{t('pagination.previous', language)}</button>
                        <span className="text-xs font-mono text-zinc-400">{t('pagination.page', language, { current: currentPage, total: totalPages })}</span>
                        <button onClick={() => onSetCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-xs font-semibold text-zinc-200 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50">{t('pagination.next', language)}</button>
                    </div>
                )}
            </div>
        </div>
    );
};