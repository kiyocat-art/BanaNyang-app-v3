import React, { useState, useEffect, useRef } from 'react';
import { PromptFolder, PromptItem } from '../types';
import { t, Language } from '../localization';
import { CloseIcon, FolderPlusIcon, PencilIcon, StarIcon, TrashIcon } from './icons';
import { Tooltip } from './Tooltip';

interface PresetManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPrompt: string;
    onLoadPrompt: (prompt: string) => void;
    onNotification: (message: string, type: 'success' | 'error') => void;
    language: Language;
    folders: PromptFolder[];
    saveFolders: (folders: PromptFolder[]) => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
    isOpen,
    onClose,
    currentPrompt,
    onLoadPrompt,
    onNotification,
    language,
    folders,
    saveFolders
}) => {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [editingFolder, setEditingFolder] = useState<{ id: string, name: string } | null>(null);
    const [editingPreset, setEditingPreset] = useState<PromptItem | null>(null);

    // New state for adding presets inside the modal
    const [newPresetName, setNewPresetName] = useState('');
    const [newPresetPrompt, setNewPresetPrompt] = useState('');


    useEffect(() => {
        if (isOpen) {
            const currentSelectionExists = folders.some(f => f.id === selectedFolderId);
            if (!currentSelectionExists && folders.length > 0) {
                setSelectedFolderId(folders[0].id);
            } else if (folders.length === 0) {
                setSelectedFolderId(null);
            }
        }
    }, [isOpen, folders, selectedFolderId]);

    const handleAddFolder = () => {
        const newFolder: PromptFolder = {
            id: crypto.randomUUID(),
            name: `${t('presets.folder', language)} ${folders.length + 1}`,
            presets: [],
            // FIX: Explicitly set showInQuickBar to true for new folders.
            showInQuickBar: true,
        };
        const newFolders = [...folders, newFolder];
        saveFolders(newFolders);
        setSelectedFolderId(newFolder.id);
        setEditingFolder({ id: newFolder.id, name: newFolder.name });
    };

    const handleDeleteFolder = (folderId: string) => {
        if (window.confirm(t('presets.deleteFolderConfirm', language))) {
            const newFolders = folders.filter(f => f.id !== folderId);
            saveFolders(newFolders);
            if (selectedFolderId === folderId) {
                setSelectedFolderId(newFolders.length > 0 ? newFolders[0].id : null);
            }
        }
    };
    
    const handleRenameFolder = () => {
        if (!editingFolder || !editingFolder.name.trim()) {
            setEditingFolder(null);
            return;
        };
        const newFolders = folders.map(f =>
            f.id === editingFolder.id ? { ...f, name: editingFolder.name.trim() } : f
        );
        saveFolders(newFolders);
        setEditingFolder(null);
    };
    
    const handleSaveCurrentPrompt = () => {
        if (!selectedFolderId || !currentPrompt.trim()) return;
        const presetName = prompt(t('presets.presetNamePlaceholder', language), t('presets.untitled', language))
        if(!presetName || !presetName.trim()) return;

        const newPreset: PromptItem = {
            id: crypto.randomUUID(),
            name: presetName.trim(),
            prompt: currentPrompt,
        };

        const newFolders = folders.map(folder => {
            if (folder.id === selectedFolderId) {
                return { ...folder, presets: [...folder.presets, newPreset] };
            }
            return folder;
        });

        saveFolders(newFolders);
        onNotification(t('presets.promptSaved', language), 'success');
    };

    const handleAddNewPreset = () => {
        if (!selectedFolderId || !newPresetName.trim() || !newPresetPrompt.trim()) return;
    
        const newPreset: PromptItem = {
            id: crypto.randomUUID(),
            name: newPresetName.trim(),
            prompt: newPresetPrompt.trim(),
        };
    
        const newFolders = folders.map(folder => {
            if (folder.id === selectedFolderId) {
                return { ...folder, presets: [...folder.presets, newPreset] };
            }
            return folder;
        });
    
        saveFolders(newFolders);
        // Clear the form
        setNewPresetName('');
        setNewPresetPrompt('');
        onNotification(t('presets.promptSaved', language), 'success');
    };

    const handleDeletePreset = (presetId: string) => {
        if (!selectedFolderId || !window.confirm(t('presets.deleteConfirm', language))) return;

        const newFolders = folders.map(folder => {
            if (folder.id === selectedFolderId) {
                return { ...folder, presets: folder.presets.filter(p => p.id !== presetId) };
            }
            return folder;
        });
        saveFolders(newFolders);
    };
    
    const handleSavePresetEdit = () => {
        if (!editingPreset || !editingPreset.name.trim() || !selectedFolderId) {
            setEditingPreset(null);
            return;
        }

        const newFolders = folders.map(f => {
            if (f.id === selectedFolderId) {
                return {
                    ...f,
                    presets: f.presets.map(p => p.id === editingPreset.id ? editingPreset : p)
                };
            }
            return f;
        });
        saveFolders(newFolders);
        setEditingPreset(null);
    };

    const handleToggleQuickBar = (folderId: string) => {
        const newFolders = folders.map(f =>
            f.id === folderId ? { ...f, showInQuickBar: !(f.showInQuickBar ?? true) } : f
        );
        saveFolders(newFolders);
    };

    if (!isOpen) {
        return null;
    }

    const selectedFolder = folders.find(f => f.id === selectedFolderId);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[210]">
            <div className="bg-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-lg w-full max-w-4xl h-[70vh] shadow-lg flex flex-col animate-category-fade-in">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-zinc-100">{t('presets.modalTitle', language)}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveCurrentPrompt}
                            disabled={!currentPrompt.trim() || !selectedFolderId}
                            className="px-4 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-50"
                        >
                            {t('presets.saveCurrentPrompt', language)}
                        </button>
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-neutral-700 transition-colors">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-grow flex min-h-0">
                    {/* Folders List */}
                    <div className="w-1/3 flex-shrink-0 border-r border-white/10 flex flex-col">
                        <div className="p-4">
                            <button onClick={handleAddFolder} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <FolderPlusIcon className="w-5 h-5" />
                                <span>{t('presets.newFolder', language)}</span>
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto px-2 pb-2">
                            {folders.length === 0 ? (
                                <p className="text-center text-sm text-zinc-500 p-4">{t('presets.noFolders', language)}</p>
                            ) : (
                                folders.map(folder => (
                                    <div key={folder.id} className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedFolderId === folder.id ? 'bg-sky-600' : 'hover:bg-neutral-700'}`}
                                        onClick={() => setSelectedFolderId(folder.id)}>
                                        {editingFolder?.id === folder.id ? (
                                            <input
                                                type="text"
                                                value={editingFolder.name}
                                                onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                                                onBlur={handleRenameFolder}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
                                                autoFocus
                                                className="bg-transparent w-full outline-none"
                                            />
                                        ) : (
                                            <span className="truncate">{folder.name}</span>
                                        )}
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Tooltip tip={t('presets.toggleQuickBar', language)}>
                                                <button onClick={(e) => { e.stopPropagation(); handleToggleQuickBar(folder.id); }} className={`p-1 hover:text-yellow-400 ${(folder.showInQuickBar ?? true) ? 'text-yellow-400' : 'text-zinc-400'}`}>
                                                    <StarIcon className="w-4 h-4" filled={folder.showInQuickBar ?? true} />
                                                </button>
                                            </Tooltip>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingFolder({ id: folder.id, name: folder.name }); }} className="p-1 hover:text-white text-zinc-400"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 hover:text-red-400 text-zinc-400"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Presets List */}
                    <div className="w-2/3 flex-grow overflow-y-auto p-4">
                        {!selectedFolder ? (
                            <div className="flex items-center justify-center h-full text-zinc-500">
                                {folders.length > 0 && <p>{t('presets.selectFolder', language)}</p>}
                            </div>
                        ) : (
                            <>
                                {selectedFolder.presets.length === 0 ? (
                                     <p className="text-center text-sm text-zinc-500 pt-4">{t('presets.noPresets', language)}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedFolder.presets.map(preset => (
                                            editingPreset?.id === preset.id ? (
                                                <div key={preset.id} className="bg-neutral-700/50 p-3 rounded-md border border-white/20">
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            value={editingPreset.name}
                                                            onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                                                            className="w-full bg-neutral-900/50 border border-neutral-600 rounded-md py-2 px-3 text-sm font-semibold text-zinc-100 placeholder-zinc-400 focus:ring-1 focus:ring-white outline-none"
                                                        />
                                                        <textarea
                                                            value={editingPreset.prompt}
                                                            onChange={(e) => setEditingPreset({ ...editingPreset, prompt: e.target.value })}
                                                            className="w-full bg-neutral-900/50 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-300 placeholder-zinc-400 focus:ring-1 focus:ring-white outline-none resize-y"
                                                            rows={4}
                                                        />
                                                        <div className="flex justify-end gap-2 mt-1">
                                                            <button onClick={() => setEditingPreset(null)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors">{t('presets.cancel', language)}</button>
                                                            <button onClick={handleSavePresetEdit} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white transition-colors">{t('presets.save', language)}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                            <div key={preset.id} className="group bg-neutral-900/50 p-3 rounded-md border border-transparent hover:border-white/10">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-grow mr-4">
                                                        <h4 className="text-base font-semibold text-zinc-100">{preset.name}</h4>
                                                        <p className="text-sm text-zinc-400 max-h-24 overflow-y-auto whitespace-pre-wrap">{preset.prompt}</p>
                                                    </div>
                                                    <div className="flex-shrink-0 flex items-center gap-2">
                                                        <button onClick={() => { onLoadPrompt(preset.prompt); onClose(); }} className="px-3 py-1 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors">{t('presets.usePreset', language)}</button>
                                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setEditingPreset(preset)} className="p-1 hover:text-white text-zinc-400"><PencilIcon className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeletePreset(preset.id)} className="p-1 hover:text-red-400 text-zinc-400"><TrashIcon className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            )
                                        ))}
                                    </div>
                                )}
                                {/* New Preset Form */}
                                <div className="mt-6 pt-4 border-t border-white/10">
                                    <h4 className="text-base font-semibold text-zinc-100 mb-2">{t('presets.addNewPresetTitle', language)}</h4>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            placeholder={t('presets.presetNamePlaceholder', language)}
                                            value={newPresetName}
                                            onChange={(e) => setNewPresetName(e.target.value)}
                                            className="w-full bg-neutral-900/50 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-200 placeholder-zinc-400 focus:ring-1 focus:ring-white outline-none"
                                        />
                                        <textarea
                                            placeholder={t('presets.promptContentPlaceholder', language)}
                                            value={newPresetPrompt}
                                            onChange={(e) => setNewPresetPrompt(e.target.value)}
                                            className="w-full bg-neutral-900/50 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-200 placeholder-zinc-400 focus:ring-1 focus:ring-white outline-none resize-y"
                                            rows={3}
                                        />
                                        <button
                                            onClick={handleAddNewPreset}
                                            disabled={!selectedFolderId || !newPresetName.trim() || !newPresetPrompt.trim()}
                                            className="mt-1 self-end px-4 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-50"
                                        >
                                            {t('presets.addPresetButton', language)}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};