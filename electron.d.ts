export interface IElectronAPI {
  onLoadWorkspace: (callback: (filePath: string | null, fileContent: string) => void) => () => void;
  setDirty: (isDirty: boolean) => void;
  onCanClose: (callback: () => void) => () => void;
  confirmClose: () => void;
  onSaveAndQuit: (callback: () => void) => () => void;
  savedAndReadyToQuit: () => void;
  saveFile: (filePath: string, content: string) => Promise<boolean>;
  // FIX: Updated return type to include optional error string.
  saveAs: (content: string) => Promise<{ success: boolean; filePath: string | null; error?: string; }>;
  // FIX: Added 'openFileDialog' to match 'src/electron.d.ts' and resolve conflicts.
  openFileDialog: () => Promise<{ filePath: string; content: string } | null>;
  // FIX: Add missing properties to match src/electron.d.ts and resolve declaration conflicts.
  writeImage: (dataURL: string) => void;
  readImage: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}