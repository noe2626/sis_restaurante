const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
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
