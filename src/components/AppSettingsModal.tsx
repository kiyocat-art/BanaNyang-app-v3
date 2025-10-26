import React, { useState, useEffect, useRef } from 'react';
import { t, Language, TranslationKey } from '../localization';
import { CloseIcon, SettingsIcon, FolderPlusIcon, PencilIcon, StarIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import { getApiKey, setApiKey } from '../services/geminiService';
import { MonthlyCredit, PromptFolder, PromptItem } from '../types';
import { Tooltip } from './Tooltip';
import { useShortcutStore, formatShortcut, ShortcutAction, Shortcut } from '../hooks/useShortcuts';


interface AppSettingsModalProps {
  onSaveApiKey: (apiKey: string) => void;
  onClose: () => void;
  language: Language;
  monthlyCredit: MonthlyCredit;
  onUpdateTotalCredit: (newTotal: number) => void;
  folders: PromptFolder[];
  saveFolders: (folders: PromptFolder[]) => void;
  currentPrompt: string;
  onLoadPrompt: (prompt: string) => void;
  onNotification: (message: string, type: 'success' | 'error') => void;
  manualUsedCredit: number | '';
  onManualUsedCreditChange: (value: string) => void;
  onUpdateCredit: () => void;
  onCreditInputBlur: () => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ 
    onSaveApiKey, 
    onClose, 
    language,
    monthlyCredit,
    onUpdateTotalCredit,
    folders,
    saveFolders,
    currentPrompt,
    onLoadPrompt,
    onNotification,
    manualUsedCredit,
    onManualUsedCreditChange,
    onUpdateCredit,
    onCreditInputBlur,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey() || '');
  const [totalCreditInput, setTotalCreditInput] = useState(monthlyCredit.total.toString());
  const [isPresetManagerExpanded, setIsPresetManagerExpanded] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<{ id: string, name: string } | null>(null);
  const [editingPreset, setEditingPreset] = useState<PromptItem | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPrompt, setNewPresetPrompt] = useState('');

  const { shortcuts, setShortcut, resetShortcuts } = useShortcutStore();
  const [listeningFor, setListeningFor] = useState<ShortcutAction | null>(null);
  const [isShortcutsExpanded, setIsShortcutsExpanded] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (listeningFor) {
          setListeningFor(null);
        } else {
          onClose();
        }
      } else if (listeningFor) {
        e.preventDefault();
        e.stopPropagation();
        
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const newShortcut: Shortcut = {
            key: e.key,
            ctrlKey: !isMac && e.ctrlKey,
            metaKey: isMac && e.metaKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
        };
        // Ensure that either ctrl or meta is true if the platform-specific key was pressed
        if (e.ctrlKey && isMac) newShortcut.ctrlKey = true;
        if (e.metaKey && !isMac) newShortcut.metaKey = true;

        setShortcut(listeningFor, newShortcut);
        setListeningFor(null);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [onClose, listeningFor, setShortcut]);

  useEffect(() => {
    setTotalCreditInput(monthlyCredit.total.toString());
  }, [monthlyCredit.total]);

  useEffect(() => {
      if (isPresetManagerExpanded) {
          const currentSelectionExists = folders.some(f => f.id === selectedFolderId);
          if (!currentSelectionExists && folders.length > 0) {
              setSelectedFolderId(folders[0].id);
          } else if (folders.length === 0) {
              setSelectedFolderId(null);
          }
      }
  }, [isPresetManagerExpanded, folders, selectedFolderId]);

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
    onSaveApiKey(apiKeyInput);
  };
  
  const handleApiKeyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveApiKey();
    }
  };

  const handleTotalCreditUpdate = () => {
    const newTotal = parseInt(totalCreditInput.replace(/,/g, ''), 10);
    if (!isNaN(newTotal) && newTotal >= 0) {
        onUpdateTotalCredit(newTotal);
    } else {
        setTotalCreditInput(monthlyCredit.total.toString());
    }
  };

  const formatNumber = (value: string) => {
    const num = parseInt(value.replace(/,/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString();
  };

  // --- Preset Manager Logic ---
  const handleAddFolder = () => {
      const newFolder: PromptFolder = {
          id: crypto.randomUUID(),
          name: `${t('presets.folder', language)} ${folders.length + 1}`,
          presets: [],
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

      const newPreset: PromptItem = { id: crypto.randomUUID(), name: presetName.trim(), prompt: currentPrompt };
      const newFolders = folders.map(folder => folder.id === selectedFolderId ? { ...folder, presets: [...folder.presets, newPreset] } : folder);
      saveFolders(newFolders);
      onNotification(t('presets.promptSaved', language), 'success');
  };

  const handleAddNewPreset = () => {
      if (!selectedFolderId || !newPresetName.trim() || !newPresetPrompt.trim()) return;
      const newPreset: PromptItem = { id: crypto.randomUUID(), name: newPresetName.trim(), prompt: newPresetPrompt.trim() };
      const newFolders = folders.map(folder => folder.id === selectedFolderId ? { ...folder, presets: [...folder.presets, newPreset] } : folder);
      saveFolders(newFolders);
      setNewPresetName(''); setNewPresetPrompt('');
      onNotification(t('presets.promptSaved', language), 'success');
  };

  const handleDeletePreset = (presetId: string) => {
      if (!selectedFolderId || !window.confirm(t('presets.deleteConfirm', language))) return;
      const newFolders = folders.map(folder => folder.id === selectedFolderId ? { ...folder, presets: folder.presets.filter(p => p.id !== presetId) } : folder);
      saveFolders(newFolders);
  };
  
  const handleSavePresetEdit = () => {
      if (!editingPreset || !editingPreset.name.trim() || !selectedFolderId) {
          setEditingPreset(null);
          return;
      }
      const newFolders = folders.map(f => f.id === selectedFolderId ? { ...f, presets: f.presets.map(p => p.id === editingPreset.id ? editingPreset : p) } : f);
      saveFolders(newFolders);
      setEditingPreset(null);
  };

  const handleToggleQuickBar = (folderId: string) => {
      const newFolders = folders.map(f => f.id === folderId ? { ...f, showInQuickBar: !(f.showInQuickBar ?? true) } : f);
      saveFolders(newFolders);
  };

  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const shortcutActions = Object.keys(shortcuts) as ShortcutAction[];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
      <div className="bg-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-lg p-6 max-w-4xl w-full shadow-lg relative animate-category-fade-in max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white rounded-full hover:bg-neutral-700 transition-colors z-10">
            <CloseIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-6 flex-shrink-0">
            <SettingsIcon className="w-6 h-6 text-zinc-300" />
            <h2 className="text-xl font-bold text-zinc-100">{t('appSettingsModal.title', language)}</h2>
        </div>
        
        <div className="space-y-6 overflow-y-auto pr-2">
            {/* API Key Settings */}
            <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{t('appSettingsModal.apiTitle', language)}</h3>
                <p className="text-sm text-zinc-400 mb-4" dangerouslySetInnerHTML={{ __html: t('appSettingsModal.apiBody', language) }}></p>
                <div>
                    <label htmlFor="api-key-input" className="block text-sm font-medium text-zinc-300 mb-2">{t('appSettingsModal.googleApiKey', language)}</label>
                    <div className="flex gap-2">
                        <input
                            id="api-key-input"
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            onKeyDown={handleApiKeyKeyDown}
                            placeholder={t('appSettingsModal.apiKeyPlaceholder', language)}
                            className="flex-grow bg-neutral-900 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-200 focus:ring-1 focus:ring-white focus:border-white outline-none"
                        />
                         <button
                            onClick={handleSaveApiKey}
                            className="px-4 py-2 font-semibold text-sm rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors"
                        >
                            {t('appSettingsModal.save', language)}
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">{t('appSettingsModal.apiKeyExplanation', language)}</p>
                </div>
            </div>

            {/* Credit Settings */}
            <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{t('appSettingsModal.creditTitle', language)}</h3>
                <div>
                    <label htmlFor="max-credit-input" className="block text-sm font-medium text-zinc-300 mb-2">{t('appSettingsModal.maxCreditLabel', language)}</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={formatNumber(totalCreditInput)}
                            onChange={(e) => setTotalCreditInput(e.target.value.replace(/[^0-9,]/g, ''))}
                            onBlur={handleTotalCreditUpdate}
                            onKeyDown={(e) => e.key === 'Enter' && handleTotalCreditUpdate()}
                            className="flex-grow bg-neutral-900 border border-neutral-600 rounded-md py-2 px-3 text-sm font-mono text-zinc-200 focus:ring-1 focus:ring-white focus:border-white outline-none"
                        />
                         <button
                            onClick={handleTotalCreditUpdate}
                            className="px-4 py-2 font-semibold text-sm rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors"
                        >
                            {t('creditAdjustment.updateButton', language)}
                        </button>
                    </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="used-credit-input" className="block text-sm font-medium text-zinc-300 mb-2">{t('creditAdjustment.usedAmount', language)}</label>
                  <div className="flex gap-2">
                      <input 
                          id="used-credit-input" 
                          type="number" 
                          value={manualUsedCredit} 
                          onChange={(e) => onManualUsedCreditChange(e.target.value)} 
                          onBlur={onCreditInputBlur} 
                          className="flex-grow bg-neutral-900 border border-neutral-600 rounded-md py-2 px-3 text-sm font-mono text-zinc-200 text-right focus:ring-1 focus:ring-white focus:border-white outline-none"
                      />
                      <button 
                          onClick={onUpdateCredit} 
                          className="px-4 py-2 font-semibold text-sm rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors"
                      >
                          {t('creditAdjustment.updateButton', language)}
                      </button>
                  </div>
                </div>
            </div>

             {/* Shortcut Settings */}
            <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-zinc-200">{t('appSettingsModal.shortcutsTitle', language)}</h3>
                        <button onClick={() => setIsShortcutsExpanded(!isShortcutsExpanded)} className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-neutral-700 transition-colors">
                            {isShortcutsExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    <button onClick={resetShortcuts} className="px-3 py-1 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors">
                        {t('appSettingsModal.resetDefaults', language)}
                    </button>
                </div>
                {isShortcutsExpanded && (
                    <>
                        <p className="text-sm text-zinc-400 mb-4">{t('appSettingsModal.shortcutsDescription', language)}</p>
                        <div className="space-y-2">
                            {shortcutActions.map(action => (
                                <div key={action} className="flex items-center justify-between p-2 rounded-md bg-neutral-900/50">
                                    <span className="text-sm text-zinc-300">{t(`shortcut.${action}` as TranslationKey, language)}</span>
                                    <button
                                        onClick={() => setListeningFor(action)}
                                        className="px-4 py-1.5 text-sm font-mono tracking-wider rounded-md bg-neutral-700 text-zinc-100 hover:bg-neutral-600 w-48 text-center"
                                    >
                                        {listeningFor === action ? t('appSettingsModal.listening', language) : formatShortcut(shortcuts[action])}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            
            {/* Preset Settings */}
            <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-zinc-200">{t('appSettingsModal.presetTitle', language)}</h3>
                      <button onClick={() => setIsPresetManagerExpanded(!isPresetManagerExpanded)} className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-neutral-700 transition-colors">
                          {isPresetManagerExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                      </button>
                  </div>
                </div>

                {isPresetManagerExpanded && (
                    <div className="flex flex-col h-[50vh] animate-category-fade-in">
                       <div className="flex-shrink-0 flex items-center justify-end p-2 border-b border-t border-white/10">
                          <button onClick={handleSaveCurrentPrompt} disabled={!currentPrompt.trim() || !selectedFolderId} className="px-4 py-2 text-sm font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors disabled:opacity-50">
                              {t('presets.saveCurrentPrompt', language)}
                          </button>
                       </div>
                        <div className="flex-grow flex min-h-0">
                            <div className="w-1/3 flex-shrink-0 border-r border-white/10 flex flex-col">
                                <div className="p-4"><button onClick={handleAddFolder} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"><FolderPlusIcon className="w-5 h-5" /><span>{t('presets.newFolder', language)}</span></button></div>
                                <div className="flex-grow overflow-y-auto px-2 pb-2">
                                    {folders.length === 0 ? <p className="text-center text-sm text-zinc-500 p-4">{t('presets.noFolders', language)}</p> : folders.map(folder => (
                                        <div key={folder.id} className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedFolderId === folder.id ? 'bg-white text-black' : 'hover:bg-neutral-700 text-zinc-200'}`} onClick={() => setSelectedFolderId(folder.id)}>
                                            {editingFolder?.id === folder.id ? <input type="text" value={editingFolder.name} onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })} onBlur={handleRenameFolder} onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()} autoFocus className="bg-transparent w-full outline-none text-black" /> : <span className="truncate">{folder.name}</span>}
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Tooltip tip={t('presets.toggleQuickBar', language)}><button onClick={(e) => { e.stopPropagation(); handleToggleQuickBar(folder.id); }} className={`p-1 hover:text-yellow-400 ${(folder.showInQuickBar ?? true) ? 'text-yellow-400' : 'text-zinc-400'}`}><StarIcon className="w-4 h-4" filled={folder.showInQuickBar ?? true} /></button></Tooltip>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingFolder({ id: folder.id, name: folder.name }); }} className="p-1 hover:text-white text-zinc-400"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 hover:text-red-400 text-zinc-400"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-2/3 flex-grow overflow-y-auto p-4">
                                {!selectedFolder ? (folders.length > 0 && <div className="flex items-center justify-center h-full text-zinc-500"><p>{t('presets.selectFolder', language)}</p></div>) : (<>
                                    {selectedFolder.presets.length === 0 ? <p className="text-center text-sm text-zinc-500 pt-4">{t('presets.noPresets', language)}</p> : (
                                        <div className="space-y-2">
                                            {selectedFolder.presets.map(preset => (editingPreset?.id === preset.id ? (
                                                <div key={preset.id} className="bg-neutral-700/50 p-3 rounded-md border border-white/20"><div className="flex flex-col gap-2">
                                                    <input type="text" value={editingPreset.name} onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })} className="w-full bg-neutral-900/50 border border-neutral-600 rounded-md py-2 px-3 text-sm font-semibold text-zinc-100 placeholder-zinc-400 focus:ring-1 focus:ring-white outline-none" />
                                                    <textarea value={editingPreset.prompt} onChange={(e) => setEditingPreset({ ...editingPreset, prompt: e.target.value })} className="w-full bg-neutral-900/50 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-300 placeholder-zinc-400 focus:ring-1 focus:ring-white outline-none resize-y" rows={4} />
                                                    <div className="flex justify-end gap-2 mt-1">
                                                        <button onClick={() => setEditingPreset(null)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors">{t('presets.cancel', language)}</button>
                                                        <button onClick={handleSavePresetEdit} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors">{t('presets.save', language)}</button>
                                                    </div>
                                                </div></div>
                                            ) : (
                                            <div key={preset.id} className="group bg-neutral-900/50 p-3 rounded-md border border-transparent hover:border-white/10">
                                                <div className="flex items-start justify-between"><div className="flex-grow mr-4">
                                                    <h4 className="text-base font-semibold text-zinc-100">{preset.name}</h4>
                                                    <p className="text-sm text-zinc-400 max-h-24 overflow-y-auto whitespace-pre-wrap">{preset.prompt}</p>
                                                </div><div className="flex-shrink-0 flex items-center gap-2">
                                                    <button onClick={() => { onLoadPrompt(preset.prompt); onClose(); }} className="px-3 py-1 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors">{t('presets.usePreset', language)}</button>
                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditingPreset(preset)} className="p-1 hover:text-white text-zinc-400"><PencilIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeletePreset(preset.id)} className="p-1 hover:text-red-400 text-zinc-400"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div></div>
                                            </div>
                                            )))}
                                        </div>
                                    )}
                                    <div className="mt-6 pt-4 border-t border-white/10"><h4 className="text-base font-semibold text-zinc-100 mb-2">{t('presets.addNewPresetTitle', language)}</h4><div className="flex flex-col gap-2">
                                        <input type="text" placeholder={t('presets.presetNamePlaceholder', language)} value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="w-full bg-neutral-900/50 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-200 placeholder-zinc-400 focus:ring-1 focus:ring-white outline-none" />
                                        <textarea placeholder={t('presets.promptContentPlaceholder', language)} value={newPresetPrompt} onChange={(e) => setNewPresetPrompt(e.target.value)} className="w-full bg-neutral-900/50 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-200 placeholder-zinc-400 focus:ring-1 focus:ring-white outline-none resize-y" rows={3} />
                                        <button onClick={handleAddNewPreset} disabled={!selectedFolderId || !newPresetName.trim() || !newPresetPrompt.trim()} className="mt-1 self-end px-4 py-2 text-sm font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors disabled:opacity-50">{t('presets.addPresetButton', language)}</button>
                                    </div></div>
                                </>)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};