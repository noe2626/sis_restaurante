const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printSilent: (html) => ipcRenderer.send('print-silent', html),
  isElectron: () => true
});
