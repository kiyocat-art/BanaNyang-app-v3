import React from 'react';
import { t, Language, TranslationKey } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';
import { LightIcon } from '../../../components/icons';

export const LightingDirectionSelector: React.FC<{
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
                  <div key={index} className={`w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/5 rounded-md transition-colors ${isLightDirectionActive ? 'text-yellow-500' : 'text-zinc-600'}`}>
                      <LightIcon className="w-8 h-8"/>
                  </div>
                );
              }
              const isSelected = isLightDirectionActive && isDirectionSelected(direction);
              const baseClass = 'w-12 h-12 lg:w-14 lg:h-14 rounded-md transition-colors';
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
