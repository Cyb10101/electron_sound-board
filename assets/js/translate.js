'use strict';

const {Language} = require('./language.js');
const language = new Language();

document.addEventListener('DOMContentLoaded', function () {
    language.promiseWhen(() => {return language.initialized;}, 5000).then(() => {
        language.translate();
    }, () => {
        console.error('Language is not initialized! (translate.js)');
    });
});
