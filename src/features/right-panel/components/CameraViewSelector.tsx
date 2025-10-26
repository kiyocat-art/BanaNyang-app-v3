import React from 'react';
import { t, Language, TranslationKey } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';

export const CameraViewSelector: React.FC<{
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
                  <div key={index} className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/5 rounded-md text-zinc-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                  </div>
                );
              }
              const isSelected = isCameraViewActive && isViewActive(view);
              const baseClass = 'w-12 h-12 lg:w-14 lg:h-14 rounded-md transition-colors';
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
