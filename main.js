const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 개발 환경 체크
const isDev = process.env.NODE_ENV === 'development';

// V8 플래그 설정으로 안정성 향상 - 매우 보수적 설정
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--js-flags', '--jitless --no-expose-wasm --no-wasm-simd-post-mvp --no-wasm-memory64');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.commandLine.appendSwitch('--disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('--disable-accelerated-video-decode');

let mainWindow;

function createWindow() {
  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false, // API 호출을 위해 필요
      experimentalFeatures: false,
      v8CacheOptions: 'none',
      sandbox: false,
      webgl: false,
      plugins: false,
      backgroundThrottling: false,
      offscreen: false,
      nodeIntegrationInWorker: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'Auxclick'
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false // 초기에 숨김
  });

  // HTML 파일 로드
  mainWindow.loadFile('index.html');

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 개발 환경에서는 DevTools 자동 열기
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 윈도우가 닫힐 때
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 메뉴 설정
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: 'SRT 파일 열기',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'SRT 파일', extensions: ['srt'] },
                { name: '모든 파일', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              const content = fs.readFileSync(filePath, 'utf8');
              
              // 렌더러 프로세스에 파일 정보 전송
              mainWindow.webContents.send('file-opened', {
                path: filePath,
                name: path.basename(filePath),
                content: content
              });
            }
          }
        },
        {
          label: '번역된 SRT 저장',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-translated-srt');
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' },
        { role: 'selectall', label: '모두 선택' }
      ]
    },
    {
      label: '번역',
      submenu: [
        {
          label: '번역 시작',
          accelerator: 'F5',
          click: () => {
            mainWindow.webContents.send('start-translation');
          }
        },
        {
          label: '번역 중단',
          accelerator: 'Escape',
          click: () => {
            mainWindow.webContents.send('stop-translation');
          }
        }
      ]
    },
    {
      label: '도구',
      submenu: [
        {
          label: '설정 초기화',
          click: () => {
            mainWindow.webContents.send('reset-config');
          }
        },
        { type: 'separator' },
        {
          label: '개발자 도구',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '사용 방법',
          click: () => {
            mainWindow.webContents.send('show-help');
          }
        },
        {
          label: '네이버 클라우드 플랫폼',
          click: () => {
            require('electron').shell.openExternal('https://www.ncloud.com');
          }
        },
        { type: 'separator' },
        {
          label: 'SRT 번역기 v1.0.0',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '정보',
              message: 'SRT 자막 번역기',
              detail: '버전: 1.0.0\n네이버 클라우드 플랫폼 기반\n\n개발: Your Company'
            });
          }
        }
      ]
    }
  ];

  // macOS 메뉴 조정
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: '정보' },
        { type: 'separator' },
        { role: 'services', label: '서비스' },
        { type: 'separator' },
        { role: 'hide', label: '숨기기' },
        { role: 'hideothers', label: '다른 앱 숨기기' },
        { role: 'unhide', label: '모두 보기' },
        { type: 'separator' },
        { role: 'quit', label: '종료' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 통신 핸들러
ipcMain.handle('save-file-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('save-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-error-dialog', async (event, title, content) => {
  return dialog.showErrorBox(title, content);
});

ipcMain.handle('show-info-dialog', async (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

// 앱 이벤트 핸들러
app.whenReady().then(() => {
  createWindow();

  // macOS에서 dock 아이콘 클릭 시
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫힐 때
app.on('window-all-closed', () => {
  // macOS가 아니면 앱 종료
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 앱이 활성화될 때
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 보안 설정
app.on('web-contents-created', (event, contents) => {
  // 외부 탐색 방지
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  // 새 윈도우 열기 방지
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// 개발 환경 설정
if (isDev) {
  // Hot reload를 위한 설정
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (_) {}
}