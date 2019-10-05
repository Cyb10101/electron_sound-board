const electron = require('electron');
const {app, BrowserWindow, Menu} = require('electron');
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
     * @param gap
     */
    getSavedWindowBounds(key, gap = 0) {
        let bounds = {};
        let savedBounds = store.get(key);
        if (savedBounds) {
            let displays = electron.screen.getAllDisplays();
            let externalDisplay = displays.find((display) => {
                let x = (display.workArea.x <= savedBounds.x && savedBounds.x < (display.bounds.x + display.size.width - gap));
                let y = (display.workArea.y <= savedBounds.y && savedBounds.y < (display.bounds.y + display.size.height - gap));
                return x && y;
            });
            if (externalDisplay) {
                bounds.x = savedBounds.x;
                bounds.y = savedBounds.y;
            }
        }
        return bounds;
    }

    mainWindowCreate() {
        mainWindow = new BrowserWindow({
            ...this.getSavedWindowBounds('mainWindowBounds'),
            width: 700 + (environment.isDevelopment() ? 555 : 0), // + DevTools
            height: (environment.isDevelopment() ? 600 : 262), // Menu + Window
            frame: true,
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

        // @todo development test
        console.log('ScaleFactor: ', electron.screen.getPrimaryDisplay().scaleFactor);

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
}

let electronApp = new ElectronApp();

app.on('ready', () => {
    electronApp.mainWindowMenu();
    electronApp.mainWindowCreate();
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
