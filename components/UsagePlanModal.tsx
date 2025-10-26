import React, { useState } from 'react';
import { t, Language } from '../localization';
import { CloseIcon, SettingsIcon } from './icons';
import { getApiKey, setApiKey } from '../services/geminiService';

interface UsagePlanModalProps {
  onSave: (apiKey: string) => void;
  onClose: () => void;
  language: Language;
}

export const UsagePlanModal: React.FC<UsagePlanModalProps> = ({ onSave, onClose, language }) => {
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey() || '');

  const handleSave = () => {
    setApiKey(apiKeyInput);
    onSave(apiKeyInput);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
      <div className="bg-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-lg p-6 max-w-lg w-full shadow-lg relative animate-category-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white rounded-full hover:bg-neutral-700 transition-colors">
            <CloseIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="w-6 h-6 text-zinc-300" />
            <h2 className="text-xl font-bold text-zinc-100">{t('usagePlanModal.title', language)}</h2>
        </div>
        <p className="text-sm text-zinc-400 mb-6" dangerouslySetInnerHTML={{ __html: t('usagePlanModal.body', language) }}></p>
        
        <div className="space-y-4">
            <div>
              <label htmlFor="api-key-input" className="block text-sm font-medium text-zinc-300 mb-2">{t('usagePlanModal.google', language)}</label>
              <input
                id="api-key-input"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('usagePlanModal.placeholder', language)}
                className="w-full bg-neutral-900 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-200 focus:ring-1 focus:ring-white focus:border-white outline-none"
              />
               <p className="text-xs text-zinc-500 mt-2">{t('usagePlanModal.apiKeyExplanation', language)}</p>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
            <button
                onClick={handleSave}
                className="px-6 py-2 font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors"
            >
                {t('usagePlanModal.save', language)}
            </button>
        </div>
      </div>
    </div>
  );
};