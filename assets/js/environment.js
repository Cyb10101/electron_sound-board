'use strict';

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

export const environment = new Environment();
