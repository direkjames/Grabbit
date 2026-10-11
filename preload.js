/*
 * Grabbit - preload bridge
 * Author: direk james
 *
 * The only things the page can ask the app to do.
 */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const listen = (channel) => (callback) => {
  const handler = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('grabbit', {
  getState: () => ipcRenderer.invoke('app:getState'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  chooseFolder: (title) => ipcRenderer.invoke('dialog:chooseFolder', title),
  openFolder: () => ipcRenderer.invoke('shell:openFolder'),
  showFile: (filePath) => ipcRenderer.invoke('shell:showFile', filePath),
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  getInfo: (url, playlist) => ipcRenderer.invoke('yt:info', { url, playlist }),
  download: (opts) => ipcRenderer.invoke('yt:download', opts),
  cancel: (id) => ipcRenderer.invoke('yt:cancel', id),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  updateYtDlp: () => ipcRenderer.invoke('ytdlp:update'),
  notify: (title, body) => ipcRenderer.invoke('notify:show', { title, body }),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  openDiscord: () => ipcRenderer.invoke('link:discord'),
  openUpdatePage: () => ipcRenderer.invoke('update:openPage'),
  onJobEvent: listen('job:event'),
  onJobFinished: listen('job:finished'),
  onHistoryChanged: listen('history:changed'),
  onYtDlpStatus: listen('ytdlp:status'),
  onUpdateStatus: listen('update:status'),
});
