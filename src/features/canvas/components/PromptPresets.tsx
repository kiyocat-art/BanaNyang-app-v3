import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { PromptFolder, PromptItem } from '../../../types';
import { t, Language } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';
import { SavePresetModal } from './SavePresetModal';


const PresetPopup: React.FC<{
    folder: PromptFolder;
    anchorEl: HTMLElement;
    onClose: () => void;
    onLoadPrompt: (prompt: string) => void;
    language: Language;
}> = ({ folder, anchorEl, onClose, onLoadPrompt, language }) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ top: '-9999px', left: '-9999px' });

    useEffect(() => {
        const anchorRect = anchorEl.getBoundingClientRect();
        const popupWidth = 240; // fixed width

        let left = anchorRect.left;
        if (left + popupWidth > window.innerWidth - 16) {
            left = anchorRect.right - popupWidth;
        }

        setStyle({
            bottom: `${window.innerHeight - anchorRect.top + 8}px`,
            left: left,
            width: `${popupWidth}px`,
        });
    }, [anchorEl]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node) && !anchorEl.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorEl]);
    
    if(!folder || folder.presets.length === 0) {
        return null; // Don't render if no presets
    }

    return ReactDOM.createPortal(
        <div
            ref={popupRef}
            style={style}
            className="fixed z-[220] bg-neutral-900/50 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl p-2 animate-category-fade-in"
        >
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
                {folder.presets.map(preset => (
                    <Tooltip
                        key={preset.id}
                        tip={<div className="max-w-xs max-h-48 overflow-y-auto p-1 text-xs">{preset.prompt}</div>}
                        position="right"
                    >
                        <button
                            onClick={() => {
                                onLoadPrompt(preset.prompt);
                                onClose();
                            }}
                            className="w-full text-left p-2 text-sm rounded-md text-zinc-200 hover:bg-white/10 transition-colors"
                        >
                            {preset.name}
                        </button>
                    </Tooltip>
                ))}
            </div>
        </div>,
        document.body
    );
};

interface PromptPresetsProps {
    currentPrompt: string;
    onLoadPrompt: (prompt: string) => void;
    language: Language;
    onManageClick: () => void;
    onSaveClick: () => void;
    folders: PromptFolder[];
    selectedFolderId: string | null;
    setSelectedFolderId: (id: string | null) => void;
}

export const PromptPresets: React.FC<PromptPresetsProps> = ({
    currentPrompt,
    onLoadPrompt,
    language,
    onManageClick,
    onSaveClick,
    folders,
    selectedFolderId,
    setSelectedFolderId
}) => {
    const [activePopup, setActivePopup] = useState<{ folderId: string; anchorEl: HTMLElement } | null>(null);
    const folderButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        if (folders.length > 0 && !folders.some(f => f.id === selectedFolderId)) {
            setSelectedFolderId(folders[0].id);
        } else if (folders.length === 0) {
            setSelectedFolderId(null);
        }
    }, [folders, selectedFolderId, setSelectedFolderId]);
    
    const handleFolderClick = (folderId: string) => {
        const anchorEl = folderButtonRefs.current[folderId];
        if (anchorEl) {
            setSelectedFolderId(folderId);
            setActivePopup(prev => (prev?.folderId === folderId ? null : { folderId, anchorEl }));
        }
    };

    const activeFolderForPopup = activePopup ? folders.find(f => f.id === activePopup.folderId) : null;

    return (
        <div className="relative">
            <div className="bg-black/20 rounded-lg flex items-center justify-between gap-2">
                <div className="flex-grow flex items-center gap-1 overflow-x-auto p-2">
                    {folders.filter(f => f.showInQuickBar ?? true).map(folder => (
                        <button 
                            key={folder.id}
                            ref={el => { folderButtonRefs.current[folder.id] = el }}
                            onClick={() => handleFolderClick(folder.id)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${activePopup?.folderId === folder.id ? 'bg-white text-black' : 'bg-transparent text-zinc-400 hover:bg-neutral-700/50 hover:text-zinc-200'}`}
                        >
                            {folder.name}
                        </button>
                    ))}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 p-2 border-l border-white/10">
                    <Tooltip tip={t('presets.saveNewPreset', language)} position="top">
                        <button 
                            onClick={onSaveClick}
                            disabled={!currentPrompt.trim()}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap bg-neutral-700 text-white hover:bg-neutral-600 disabled:bg-neutral-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                        >
                            {t('presets.save', language)}
                        </button>
                    </Tooltip>
                    <button onClick={onManageClick} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-neutral-700 text-zinc-300 hover:bg-neutral-600">{t('presets.manageButton', language)}</button>
                </div>
            </div>

             {activeFolderForPopup && activePopup && (
                <PresetPopup
                    folder={activeFolderForPopup}
                    anchorEl={activePopup.anchorEl}
                    onClose={() => setActivePopup(null)}
                    onLoadPrompt={onLoadPrompt}
                    language={language}
                />
            )}
        </div>
    );
};
