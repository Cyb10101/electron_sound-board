'use strict';

// import {ipcRenderer} from 'electron';
// import {Singleton} from "./Singleton";
const {ipcRenderer} = require('electron');
// const {Singleton} = require('./Singleton');

const fs = require('fs');
const Store = require('electron-store');
const store = new Store();

// export class Language extends Singleton {
class Language {
    constructor(appPath, locale) {
        if (appPath) {
            this.getAppPath = appPath;
            if (locale) {
                this.getLocale = locale;
            }
            this.pathLanguage = this.getAppPath + '/public/language';
            this.initialized = true;
            this.load();
        } else {
            this.initialized = false;
            this.initialize();
        }
    }

    async initialize() {
        this.getAppPath = await ipcRenderer.invoke('config', ['getAppPath']);
        if (!this.getAppPath) {
            console.error('getAppPath not set!');
            return;
        }

        this.getLocale = await ipcRenderer.invoke('config', ['getLocale']);
        if (!this.getLocale) {
            console.error('getLocale not set!');
            return;
        }

        this.pathLanguage = this.getAppPath + '/public/language';
        this.initialized = true;
        this.load();
    }

    load() {
        let language = this.getCurrent();
        this.loadedLanguage = JSON.parse(fs.readFileSync(this.pathLanguage + '/en.json', 'utf8'));
        if (language !== '' && language !== 'en') {
            let loadedLanguage2 = JSON.parse(fs.readFileSync(this.pathLanguage + '/' + language + '.json', 'utf8'));
            this.loadedLanguage = {...this.loadedLanguage, ...loadedLanguage2}; // Merge language objects
        }
    }

    getAvailable() {
        return ['en', 'de'];
    }

    getCurrent() {
        if (!this.initialized) {
            console.error('Language is not initialized! (getCurrent)');
            return;
        }

        let language = store.get('language', '');
        if (!this.getAvailable().includes(language)) {
            language = this.getLocale;
            if (!this.getAvailable().includes(language)) {
                language = 'en';
            }
        }

        if (!fs.existsSync(this.pathLanguage + '/' + language + '.json')) {
            language = 'en';
        }

        return language;
    }

    promiseWhen(condition, timeout) {
        if (!timeout) {
            timeout = 2000;
        }
        let repeated = 0;
        return new Promise((resolve) => {
            let interval = setInterval(() => {
                repeated++;
                if (condition()) {
                    resolve();
                    clearInterval(interval);
                }
                if ((repeated * 50) >= timeout) {
                    reject();
                }
            }, 50);
        });
    }

    __(phrase) {
        if (!this.initialized) {
            console.error('Language is not initialized! (__) ' + phrase);
            return;
        }

        let translation = this.loadedLanguage[phrase];
        if (translation === undefined) {
            translation = phrase;
        }
        return translation
    }

    translate() {
        if (!this.initialized) {
            console.error('Language is not initialized! (translate)');
            return;
        }

        let instance = this;
        document.querySelectorAll('.translate').forEach(function (obj) {
            obj.innerHTML = instance.__(obj.innerHTML.trim());
        });
    }

    reTranslate() {
        if (!this.initialized) {
            console.error('Language is not initialized! (reTranslate)');
            return;
        }

        this.loadedLanguage = this.objectFlip(this.loadedLanguage);
        this.translate();
        this.load();
        this.translate();
    }

    objectFlip(obj) {
        const ret = {};
        Object.keys(obj).forEach(key => {
            ret[obj[key]] = key;
        });
        return ret;
    }
}

exports.Language = Language;
