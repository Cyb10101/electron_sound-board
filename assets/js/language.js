'use strict';

const electron = require('electron');
const fs = require('fs');
let loadedLanguage;
let app = electron.app ? electron.app : electron.remote.app;
let pathLanguage = electron.app ? __dirname + '/../../' : '';

class Language {
    constructor() {
        let currentLanguage = 'en';
        if (fs.existsSync(pathLanguage + 'public/language/' + app.getLocale() + '.json')) {
            currentLanguage = app.getLocale();
        }
        loadedLanguage = JSON.parse(fs.readFileSync(pathLanguage + 'public/language/' + currentLanguage + '.json', 'utf8'));
    }

    __(phrase) {
        let translation = loadedLanguage[phrase];
        if (translation === undefined) {
            translation = phrase;
        }
        return translation
    }
}

const language = new Language();
const __ = language.__;
// module.exports = language;
module.exports = __;