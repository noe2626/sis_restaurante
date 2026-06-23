const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Carga el archivo index.html generado por Angular en la carpeta dist
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist', 'sis_restaurante', 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  // Opcional: abre las herramientas de desarrollo
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Inicia la ventana cuando Electron esté listo
app.on('ready', createWindow);

// Sale de la aplicación cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Listener de IPC para impresión silenciosa
ipcMain.on('print-silent', (event, htmlContent) => {
  console.log('[Electron main] print-silent event received. HTML Content length:', htmlContent.length);

  let workerWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  console.log('[Electron main] Offscreen workerWindow created. Loading about:blank...');
  workerWindow.loadURL('about:blank');

  workerWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron main] workerWindow loaded about:blank. Injecting HTML content...');
    
    // Inyectar el HTML de forma segura y ejecutar la impresión
    workerWindow.webContents.executeJavaScript(`
      document.open();
      document.write(${JSON.stringify(htmlContent)});
      document.close();
    `).then(() => {
      console.log('[Electron main] HTML content successfully written. Triggering print...');
      
      workerWindow.webContents.print({
        silent: true,
        printBackground: true
      }, (success, failureReason) => {
        console.log('[Electron main] Print job completed. Success:', success, 'Reason:', failureReason);
        if (!success) {
          console.error('[Electron main] Silent print failure reason:', failureReason);
        }
        workerWindow.close();
        workerWindow = null;
      });
    }).catch(err => {
      console.error('[Electron main] Error writing HTML content to workerWindow:', err);
      workerWindow.close();
      workerWindow = null;
    });
  });

  workerWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron main] workerWindow failed to load blank page:', errorCode, errorDescription);
    workerWindow.close();
    workerWindow = null;
  });
});
