// Inhibitor Command Center - Copyright (C) 2026 Drake. SPDX-License-Identifier: AGPL-3.0-only
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('icc', { quit: () => ipcRenderer.send('icc-quit') });
contextBridge.exposeInMainWorld('isElectron', true);
