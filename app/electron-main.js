// Inhibitor Command Center - Copyright (C) 2026 Drake. SPDX-License-Identifier: AGPL-3.0-only
const { app, BrowserWindow, screen, ipcMain, dialog } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Windows screensaver arguments: /s run, /p <hwnd> preview, /c[:hwnd] settings. Case-insensitive, may use '-'.
const args = process.argv.slice(1).map(a => a.toLowerCase());
const has = f => args.some(a => a === '/' + f || a === '-' + f || a.startsWith('/' + f + ':') || a.startsWith('-' + f + ':'));
const isScr = /\.scr$/i.test(process.execPath);
const mode = has('p') ? 'preview' : has('c') ? 'config' : (has('s') || args.includes('--screensaver')) ? 'saver'
  : (isScr ? 'config' : 'app');  // double-clicking a .scr with no args = settings in Windows convention
const single = args.includes('--single');

if (mode === 'preview') { app.quit(); process.exit(0); }
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const wins = [];
function open() {
  const displays = single ? [screen.getPrimaryDisplay()] : screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  // primary display gets screen 1 (command center); others get 2, 3, ... sorted left to right
  const others = displays.filter(d => d.id !== primary.id).sort((a, b) => a.bounds.x - b.bounds.x);
  [primary, ...others].forEach((d, i) => {
    const b = d.bounds;
    const w = new BrowserWindow({
      x: b.x, y: b.y, width: b.width, height: b.height, frame: false, fullscreen: true,
      backgroundColor: '#000000', autoHideMenuBar: true, alwaysOnTop: mode === 'saver', skipTaskbar: mode === 'saver' && i > 0,
      title: 'Inhibitor Command Center',
      webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false }
    });
    w.setMenu(null);
    w.loadFile('index.html', { query: { screen: String(i + 1), ss: mode === 'saver' ? '1' : '0' } });
    w.webContents.on('before-input-event', (e, input) => {
      if (mode !== 'saver' && input.type === 'keyDown' && input.key === 'F11') { w.setFullScreen(!w.isFullScreen()); e.preventDefault(); }
    });
    w.on('closed', () => { if (mode === 'saver' || i === 0) app.quit(); });
    wins.push(w);
  });
}
ipcMain.on('icc-quit', () => app.quit());
app.whenReady().then(async () => {
  if (mode === 'config') {
    await dialog.showMessageBox({
      type: 'info', title: 'Inhibitor Command Center', buttons: ['OK'],
      message: 'Inhibitor Command Center screensaver',
      detail: 'No settings needed. It fills every connected monitor: the main display shows the command center, the others show the analysis terminal.\n\nMove the mouse or press any key to exit the screensaver.'
    });
    app.quit(); return;
  }
  open();
});
app.on('window-all-closed', () => app.quit());
