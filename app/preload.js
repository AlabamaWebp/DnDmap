const { contextBridge } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('paths', {
  getImagePath: () => {
    // Формируем абсолютный путь к картинке рядом с exe
    return path.join(__dirname);
  }
});
