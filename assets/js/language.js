'use strict';

const electron = require('electron');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
let loadedLanguage;
let app = electron.app ? electron.app : electron.remote.app;
let pathLanguage = app.getAppPath() + '/public/language';

class Language {
    constructor() {
        this.load();
    }

    load() {
        let language = this.getCurrent();
        loadedLanguage = JSON.parse(fs.readFileSync(pathLanguage + '/en.json', 'utf8'));
        if (language !== '' && language !== 'en') {
            let loadedLanguage2 = JSON.parse(fs.readFileSync(pathLanguage + '/' + language + '.json', 'utf8'));
            loadedLanguage = {...loadedLanguage, ...loadedLanguage2}; // Merge language objects
        }
    }

    getAvailable() {
        return ['en', 'de'];
    }

    getCurrent() {
        let language = store.get('language', '');
        if (!this.getAvailable().includes(language)) {
            language = app.getLocale();

            if (!this.getAvailable().includes(language)) {
                language = 'en';
            }
        }

        if (!fs.existsSync(pathLanguage + '/' + language + '.json')) {
            language = 'en';
        }

        return language;
    }

    __(phrase) {
        let translation = loadedLanguage[phrase];
        if (translation === undefined) {
            translation = phrase;
        }
        return translation
    }

    translate() {
        let instance = this;
        document.querySelectorAll('.translate').forEach(function (obj) {
            obj.innerHTML = instance.__(obj.innerHTML.trim());
        });
    }

    reTranslate() {
        let instance = this;
        loadedLanguage = this.objectFlip(loadedLanguage);
        this.translate();
        language.load();
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

const language = new Language();
const __ = language.__;
exports.language = language;
exports.__ = language.__;