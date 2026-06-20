const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
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
  let workerWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Cargar contenido HTML en data URL
  workerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  workerWindow.webContents.on('did-finish-load', () => {
    workerWindow.webContents.print({
      silent: true,
      printBackground: true
    }, (success, failureReason) => {
      if (!success) {
        console.error('Fallo en impresión silenciosa:', failureReason);
      }
      workerWindow.close();
      workerWindow = null;
    });
  });
});
