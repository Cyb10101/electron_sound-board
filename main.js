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

    isLinux() {
        return (global.process.platform === 'linux'); // Even on 64 bit
    }

    isMac() {
        return (global.process.platform === 'darwin'); // Even on 64 bit
    }
}
let environment = new Environment();
/******************************************************************************/

let mainWindow;
let trayMenu;
let appQuit = false;
let clearStore = false;
let initializeStartMinimized = store.get('app-tray-instead-taskbar', false) && store.get('app-start-minimized', false);

class ElectronApp {
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
            ...this.getSavedWindowBounds('mainWindowBounds', {width: 500, height: 600}),
            minWidth: 340,
            minHeight: 340,
            frame: (store.get('app-frame', false)),
            autoHideMenuBar: false,
            resizable: true,
            useContentSize: true,
            icon: path.join(__dirname, 'assets/images/icons/round-corner/64x64.png'),
            webPreferences: {
                nodeIntegration: true
            },
            show: !initializeStartMinimized
        });
        mainWindow.setSkipTaskbar(store.get('app-tray-instead-taskbar', false));

        this.registerFileProtocol('app', __dirname + '/public/');
        this.registerFileProtocol('user', app.getPath('userData') + '/');

        if (environment.isDevelopment()) {
            mainWindow.webContents.openDevTools();
        }

        mainWindow.loadURL('app://index.html').catch(function () {
            console.error('Can\'t open Dashboard');
        });

        mainWindow.on('restore', () => {
            if (store.get('app-tray-instead-taskbar', false)) {
                mainWindow.setSkipTaskbar(false);
            }
        });

        mainWindow.on('minimize', () => {
            if (store.get('app-tray-instead-taskbar', false)) {
                mainWindow.setSkipTaskbar(true);
            }
        });

        mainWindow.on('show', (event) => {
            if (initializeStartMinimized) {
                initializeStartMinimized = false;
                mainWindow.minimize();
            }
        });

        mainWindow.on('close', (event) => {
            let bounds = mainWindow.getBounds();
            if (!clearStore) {
                if (store.get('app-frame', false)) {
                    // @todo we should't calculate window size if framed
                    if (environment.isWindows()) {
                        bounds.width -= 16;
                        bounds.height -= 39
                    } else if (environment.isLinux()) {
                        bounds.y -= 30;
                        bounds.height -= 10;
                    }
                }
                store.set('mainWindowBounds', bounds);
            }
            if (!appQuit && store.get('app-tray-instead-taskbar', false)) {
                event.preventDefault();
                mainWindow.minimize();
            }
        });

        mainWindow.on('closed', () => {
            mainWindow = null
        });
    }

    registerFileProtocol(scheme, pathName) {
        mainWindow.webContents.session.protocol.registerFileProtocol(scheme, (request, callback) => {
            const url = request.url.substr(scheme.length + 3);
            callback({path: path.normalize(pathName + url)});
        }, (error) => {
            if (error) {
                console.error('Failed to register protocol ' + scheme);
            }
        });
    }

    trayMenuOpenPage(selector) {
        if (!mainWindow) {
            this.mainWindowCreate();
        }
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('switch-page', selector);
    }

    trayMenu() {
        if (!store.get('app-tray-instead-taskbar', false)) {
            return;
        }

        let instance = this;
        trayMenu = new Tray(path.join(__dirname, 'assets/images/icons/round-corner/64x64.png'));
        trayMenu.addListener('click', function () {
            instance.trayMenuOpenPage('.page-sound-board');
        });

        const contextMenu = Menu.buildFromTemplate([{
            label: 'Sound board',
            click: function () {
                instance.trayMenuOpenPage('.page-sound-board');
            }
        }, {
            type: 'separator'
        }, {
            label: 'Settings',
            click: function () {
                instance.trayMenuOpenPage('.page-settings');
            }
        }, {
            label: 'Add own sound',
            click: function () {
                instance.trayMenuOpenPage('.page-add-own-sound');
            }
        }, {
            label: 'Edit sounds',
            click: function () {
                instance.trayMenuOpenPage('.page-edit-sounds');
            }
        }, {
            label: 'Help',
            click: function () {
                instance.trayMenuOpenPage('.page-help');
            }
        }, {
            label: 'Copyright',
            click: function () {
                instance.trayMenuOpenPage('.page-copyright');
            }
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            click: function () {
                if (store.get('app-tray-instead-taskbar', false)) {
                    appQuit = true;
                }
                app.quit();
            }
        }]);
        trayMenu.setToolTip('Sound board');
        trayMenu.setContextMenu(contextMenu);
    }

    connectIpc() {
        let instance = this;
        ipcMain.on('mainWindow', function (event, args) {
            if (args === 'close') {
                mainWindow.close();
            } else if (args === 'maximize') {
                if (mainWindow.isMaximized()) {
                    mainWindow.restore();
                } else {
                    mainWindow.maximize();
                }
            } else if (args === 'minimize') {
                mainWindow.minimize();
            }
        });

        ipcMain.on('setGlobalShortcuts', function (event, args) {
            instance.setGlobalShortcuts(args);
        });

        ipcMain.on('app', function (event, args) {
            if (args.do === 'tray-instead-taskbar') {
                let isTray = store.get('app-tray-instead-taskbar', false);
                if (isTray && !trayMenu) {
                    instance.trayMenu();
                } else {
                    // @todo destroy tray menu
                }
                mainWindow.setSkipTaskbar(isTray);
            } else if (args.do === 'restart') {
                if (store.get('app-tray-instead-taskbar', false)) {
                    appQuit = true;
                }
                app.relaunch();
                app.quit();
            } else if (args.do === 'reset') {
                mainWindow.close();
                store.clear();
                clearStore = true;
                if (args.action === 'restart') {
                    app.relaunch();
                }
                if (store.get('app-tray-instead-taskbar', false)) {
                    appQuit = true;
                }
                app.quit();
            }
        });
    }

    setGlobalShortcuts(amount) {
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
        if (amount >= 1) {
            for (let i = 1; i <= Math.min(9, amount); i++) {
                globalShortcut.register(shortcutPrefix + i, function () {
                    mainWindow.webContents.send('global-shortcut', (i - 1));
                });
            }
        }

        if (amount >= 10) {
            globalShortcut.register(shortcutPrefix + '0', function () {
                mainWindow.webContents.send('global-shortcut', 9);
            });
        }
    }
}

let electronApp = new ElectronApp();

if (!app.requestSingleInstanceLock()) {
    if (store.get('app-tray-instead-taskbar', false)) {
        appQuit = true;
    }
    app.quit();
    return; // We need it
}

app.on('second-instance', (event, argv, cwd) => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
    }
});

app.on('ready', () => {
    electronApp.mainWindowMenu();
    electronApp.mainWindowCreate();
    electronApp.connectIpc();
    electronApp.trayMenu();
});

app.on('window-all-closed', () => {
    if (!environment.isMac()) {
        if (store.get('app-tray-instead-taskbar', false)) {
            appQuit = true;
        }
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
