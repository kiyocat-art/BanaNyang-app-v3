export interface IElectronAPI {
  onLoadWorkspace: (callback: (filePath: string | null, fileContent: string) => void) => () => void;
  setDirty: (isDirty: boolean) => void;
  onCanClose: (callback: () => void) => () => void;
  confirmClose: () => void;
  // FIX: Add missing onSaveAndQuit property to resolve declaration conflict.
  onSaveAndQuit: (callback: () => void) => () => void;
  savedAndReadyToQuit: () => void;
  saveFile: (filePath: string, content: string) => Promise<boolean>;
  saveAs: (content: string) => Promise<{ success: boolean; filePath: string | null; error?: string; }>;
  openFileDialog: () => Promise<{ filePath: string; content: string } | null>;
  writeImage: (dataURL: string) => void;
  readImage: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}