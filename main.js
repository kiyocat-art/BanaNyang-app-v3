const { app, BrowserWindow, nativeTheme, ipcMain, dialog, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let openFilePath = null;
let isDirty = false;

// Handle file path from command line arguments (for Windows/Linux)
if (process.argv.length >= 2) {
    const filePath = process.argv[1];
    if (path.extname(filePath) === '.bananyang') {
        openFilePath = filePath;
    }
}

// Ensure only one instance of the app is running
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            
            // Handle file opening in second instance
            const filePath = commandLine.pop();
            if (path.extname(filePath) === '.bananyang') {
                loadWorkspaceFromFile(filePath);
            }
        }
    });
}

ipcMain.on('set-dirty-state', (event, dirty) => {
    isDirty = dirty;
});

ipcMain.handle('save-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    } catch (error) {
        console.error('Failed to save file:', error);
        return false;
    }
});

ipcMain.handle('save-as-dialog', async (event, content) => {
  if (!mainWindow) return { success: false, filePath: null, error: 'Main window not available' };
  
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Workspace As',
    defaultPath: `bananang-workspace-${new Date().toISOString().slice(0, 10)}.bananyang`,
    filters: [
      { name: 'BanaNyang Workspace', extensions: ['bananyang'] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, filePath: null }; // Indicate cancellation
  }

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, filePath: filePath };
  } catch (error) {
    console.error('Failed to save file via Save As:', error);
    return { success: false, filePath: filePath, error: error.message };
  }
});

ipcMain.on('saved-and-ready-to-quit', () => {
    if (mainWindow) {
        mainWindow.destroy();
    }
});

ipcMain.on('confirm-close', () => {
    if (mainWindow) {
        mainWindow.destroy(); // Use destroy() to force close, bypassing the 'close' event handler.
    }
});

ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Workspace',
    properties: ['openFile'],
    filters: [{ name: 'BanaNyang Workspace', extensions: ['bananyang'] }]
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const filePath = filePaths[0];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { filePath, content };
  } catch (error) {
    console.error('Failed to read workspace file from dialog:', error);
    return null;
  }
});

ipcMain.on('clipboard-write-image', (event, dataURL) => {
    if (dataURL) {
        const image = nativeImage.createFromDataURL(dataURL);
        clipboard.writeImage(image);
    }
});

ipcMain.handle('clipboard-read-image', async () => {
    const image = clipboard.readImage();
    if (image.isEmpty()) {
        return null;
    }
    return image.toDataURL();
});


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 2560,
        height: 1440,
        show: false,
        icon: path.join(__dirname, 'build/icon.png'),
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            zoomFactor: 1.0,
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindow.maximize();
    mainWindow.show();

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.setMenu(null);

    mainWindow.webContents.on('did-finish-load', () => {
        if (openFilePath) {
            loadWorkspaceFromFile(openFilePath);
            openFilePath = null; // Reset after use
        }
    });
    
    mainWindow.on('close', (e) => {
        if (isDirty) {
            e.preventDefault();
            mainWindow.webContents.send('can-i-close');
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function loadWorkspaceFromFile(filePath) {
    if (!mainWindow) return;
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        mainWindow.webContents.send('load-workspace', filePath, content);
    } catch (error) {
        console.error('Failed to read workspace file:', error);
    }
}

app.whenReady().then(() => {
    nativeTheme.themeSource = 'dark';
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Handle file opening on macOS
app.on('open-file', (event, path) => {
    event.preventDefault();
    if (mainWindow) {
        loadWorkspaceFromFile(path);
    } else {
        openFilePath = path;
    }
});