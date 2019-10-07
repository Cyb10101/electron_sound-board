const electron = require('electron');
const {app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain} = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

/******************************************************************************/
// Note: ECMAScript 2015 import not ready, Electron must support Node.js v12.11.1
class Environment {
    isProduction() {
        return (global.process.env.APP_ENV || false);
    }

    isDevelopment() {
        return (global.process.env.APP_ENV && global.process.env.APP_ENV === 'dev');
    }

    isWindows() {
        return (global.process.platform === 'win32'); // Even on 64 bit
    }

    isMac() {
        return (global.process.platform === 'darwin'); // Even on 64 bit
    }
}
let environment = new Environment();
/******************************************************************************/

let mainWindow;

class ElectronApp {
    constructor() {

    }
    mainWindowMenu() {
        const mainMenuTemplate = [{
            label: 'File',
            submenu: [{
                label: 'Quit',
                accelerator: environment.isMac() ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }]
        }, {
            label: 'Development',
            submenu: [{
                label: 'Developer Tools',
                role: 'toggledevtools'
            }]
        }, {
            label: 'Dashboard',
            click() {
                mainWindow.loadURL('app://index.html').catch(function () {
                    console.error('Can\'t open Dashboard');
                });
            }
        }, {
            role: 'reload',
            accelerator: environment.isMac() ? '' : 'F5',
        }];

        // If mac, ad empty object to menu
        if (environment.isMac()) {
            mainMenuTemplate.unshift({});
        }

        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
        if (environment.isDevelopment()) {
            Menu.setApplicationMenu(mainMenu);
        } else {
            Menu.setApplicationMenu(null);
        }
    }

    /**
     * If saved window bounds (x, y) is reachable then position will be returned.
     * @param key
     * @param defaults
     */
    getSavedWindowBounds(key, defaults = {}) {
        let bounds = {};
        let savedBounds = store.get(key);
        if (savedBounds) {
            let displays = electron.screen.getAllDisplays();
            let externalDisplay = displays.find((display) => {
                let x = (display.workArea.x <= savedBounds.x && savedBounds.x < (display.bounds.x + display.size.width));
                let y = (display.workArea.y <= savedBounds.y && savedBounds.y < (display.bounds.y + display.size.height));
                return x && y;
            });
            if (externalDisplay) {
                bounds.x = savedBounds.x;
                bounds.y = savedBounds.y;
                bounds.width = savedBounds.width;
                bounds.height = savedBounds.height;

                if (bounds.width > externalDisplay.size.width) {
                    bounds.width = defaults.hasOwnProperty('width') ? defaults.width : externalDisplay.size.width;
                }
                if (bounds.height > externalDisplay.size.height) {
                    bounds.height = defaults.hasOwnProperty('height') ? defaults.height : externalDisplay.size.height;
                }
            }
        }

        // Just set default bounds if not set
        if (!bounds.hasOwnProperty('width') && defaults.hasOwnProperty('width')) {
            bounds.width = defaults.width;
        }
        if (!bounds.hasOwnProperty('height') && defaults.hasOwnProperty('height')) {
            bounds.height = defaults.height;
        }
        return bounds;
    }

    mainWindowCreate() {
        mainWindow = new BrowserWindow({
            ...this.getSavedWindowBounds('mainWindowBounds', {width: 500, height: 450}),
            minWidth: 260,
            minHeight: 260,
            frame: (environment.isDevelopment() ? true : false),
            autoHideMenuBar: false,
            resizable: true,
            useContentSize: true,
            icon: path.join(__dirname, 'assets/images/icons/round-corner/64x64.png'),
            webPreferences: {
                nodeIntegration: true
            }
        });

        let scheme = 'app';
        mainWindow.webContents.session.protocol.registerFileProtocol(scheme, (request, callback) => {
            const url = request.url.substr(scheme.length + 3);
            callback({path: path.normalize(`${__dirname}/public/${url}`)});
        }, (error) => {
            if (error) {
                console.error('Failed to register protocol');
            }
        });

        if (environment.isDevelopment()) {
            mainWindow.webContents.openDevTools();
        }

        mainWindow.loadURL('app://index.html').catch(function () {
            console.error('Can\'t open Dashboard');
        });

        mainWindow.on('close', () => {
            store.set('mainWindowBounds', mainWindow.getBounds());
        });

        mainWindow.on('closed', () => {
            mainWindow = null
        });
    }

    trayMenu() {
        let instance = this;
        let tray = new Tray(path.join(__dirname, 'assets/images/icons/round-corner/64x64.png'));

        const contextMenu = Menu.buildFromTemplate([{
            label: 'Sound board',
            click: function () {
                if (!mainWindow) {
                    instance.mainWindowCreate();
                }
                mainWindow.focus();
                mainWindow.webContents.send('switch-page', '.page-sound-board');
            }
        }, {
            type: 'separator'
        }, {
            label: 'Settings',
            click: function () {
                if (!mainWindow) {
                    instance.mainWindowCreate();
                }
                mainWindow.focus();
                mainWindow.webContents.send('switch-page', '.page-settings');
            }
        }, {
            label: 'Help',
            click: function () {
                if (!mainWindow) {
                    instance.mainWindowCreate();
                }
                mainWindow.focus();
                mainWindow.webContents.send('switch-page', '.page-help');
            }
        }, {
            label: 'Copyright',
            click: function () {
                if (!mainWindow) {
                    instance.mainWindowCreate();
                }
                mainWindow.focus();
                mainWindow.webContents.send('switch-page', '.page-copyright');
            }
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            click: app.quit
        }]);
        tray.setToolTip('Sound board');
        tray.setContextMenu(contextMenu);
    }

    connectIpc() {
        let instance = this;
        ipcMain.on('mainWindow', function (event, args) {
            if (args === 'close') {
                mainWindow.close();
            }
        });
        ipcMain.on('setGlobalShortcuts', function () {
            instance.setGlobalShortcuts();
        });
    }

    setGlobalShortcuts() {
        globalShortcut.unregisterAll();

        let shortcutPrefix = '';
        if (store.get('modifier-ctrl', true)) {
            shortcutPrefix += 'ctrl+';
        }
        if (store.get('modifier-shift', true)) {
            shortcutPrefix += 'shift+';
        }
        if (store.get('modifier-alt', false)) {
            shortcutPrefix += 'alt+';
        }

        // Keys 1 to 9
        for (let i = 1; i <= 9; i++) {
            globalShortcut.register(shortcutPrefix + i, function () {
                mainWindow.webContents.send('global-shortcut', (i - 1));
            });
        }

        globalShortcut.register(shortcutPrefix + '0', function () {
            mainWindow.webContents.send('global-shortcut', 9);
        });
    }
}

let electronApp = new ElectronApp();

app.on('ready', () => {
    electronApp.setGlobalShortcuts();
    electronApp.mainWindowMenu();
    electronApp.mainWindowCreate();
    electronApp.connectIpc();
    electronApp.trayMenu();
});

app.on('window-all-closed', () => {
    if (!environment.isMac()) {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        electronApp.mainWindowMenu();
        electronApp.mainWindowCreate();
    }
});
