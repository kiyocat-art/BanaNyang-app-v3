const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadWorkspace: (callback) => {
    const handler = (_event, filePath, fileContent) => callback(filePath, fileContent);
    ipcRenderer.on('load-workspace', handler);
    // Return a cleanup function to remove the listener
    return () => ipcRenderer.removeListener('load-workspace', handler);
  },
  setDirty: (isDirty) => ipcRenderer.send('set-dirty-state', isDirty),
  onCanClose: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('can-i-close', handler);
    return () => ipcRenderer.removeListener('can-i-close', handler);
  },
  confirmClose: () => ipcRenderer.send('confirm-close'),
  onSaveAndQuit: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('request-save-and-quit', handler);
      return () => ipcRenderer.removeListener('request-save-and-quit', handler);
  },
  savedAndReadyToQuit: () => ipcRenderer.send('saved-and-ready-to-quit'),
  saveFile: async (filePath, content) => {
      return await ipcRenderer.invoke('save-file', filePath, content);
  },
  saveAs: async (content) => {
    return await ipcRenderer.invoke('save-as-dialog', content);
  },
  openFileDialog: async () => {
    return await ipcRenderer.invoke('open-file-dialog');
  },
  writeImage: (dataURL) => ipcRenderer.send('clipboard-write-image', dataURL),
  readImage: () => ipcRenderer.invoke('clipboard-read-image'),
});