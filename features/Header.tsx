import React from 'react';
import { t, Language } from '../localization';
import { Tooltip } from '../components/Tooltip';
import { ResetIcon, SettingsIcon } from '../components/icons';

interface HeaderProps {
    onResetAll: () => void;
    onShowUsagePlanModal: () => void;
    language: Language;
}

export const Header: React.FC<HeaderProps> = ({ onResetAll, onShowUsagePlanModal, language }) => {
    return (
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-[#2B2B2B] border-2 border-white rounded-lg">
                    <span className="font-black text-white text-3xl">B</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-lg">{t('appTitle', language)}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Tooltip tip={t('tooltip.header.manageUsagePlan', language)} position="bottom">
                    <button onClick={onShowUsagePlanModal} className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                <Tooltip tip={t('tooltip.resetAll', language)} position="bottom">
                    <button onClick={onResetAll} className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <ResetIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                <div className="h-6 w-px bg-zinc-700 mx-2"></div>
                <div className="text-sm font-semibold text-zinc-400">By.Park Kyoung Min</div>
            </div>
        </header>
    );
};
