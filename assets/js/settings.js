'use strict';

const {ipcRenderer} = require('electron');
const Store = require('electron-store');
const store = new Store();

class Settings {
    constructor() {
        this.setVolume();
        this.bindVolume();

        this.setModifier();
        this.bindModifier();

        this.setPageColor();
        this.setButtonColor();
        this.bindPageColor();
        this.bindButtonColor();
    }

    bindVolume() {
        let instance = this;
        document.querySelector('#setting-volume').addEventListener('input', function () {
            store.set('volume', parseInt(this.value, 10));
            instance.setVolume();
        });
    }

    setVolume() {
        let volume = parseInt(store.get('volume', 50), 10);
        document.querySelector('#setting-volume').value = volume;
        document.querySelector('#setting-volume-label').innerHTML = volume + '%';
    }

    bindModifier() {
        let instance = this;
        document.querySelector('#setting-modifier-ctrl').addEventListener('change', function () {
            store.set('modifier-ctrl', this.checked);
            ipcRenderer.send('setGlobalShortcuts');
        });

        document.querySelector('#setting-modifier-shift').addEventListener('change', function () {
            store.set('modifier-shift', this.checked);
            ipcRenderer.send('setGlobalShortcuts');
        });

        document.querySelector('#setting-modifier-alt').addEventListener('change', function () {
            store.set('modifier-alt', this.checked);
            ipcRenderer.send('setGlobalShortcuts');
        });
    }

    setModifier() {
        document.querySelector('#setting-modifier-ctrl').checked = store.get('modifier-ctrl', true);
        document.querySelector('#setting-modifier-shift').checked = store.get('modifier-shift', true);
        document.querySelector('#setting-modifier-alt').checked = store.get('modifier-alt', false);
    }

    bindPageColor() {
        let instance = this;
        let settingPageColor = document.querySelector('.setting-page-color');
        if (settingPageColor) {
            let bgColor = settingPageColor.querySelectorAll('div');
            for (let i = 0; i < bgColor.length; i++) {
                bgColor[i].addEventListener('click', function () {
                    let classPart = /setting-color-(\w+(-\w+)?)/g.exec(this.className);
                    if (classPart) {
                        store.set('page-color', classPart[1]);
                        instance.setPageColor();
                    }
                });
            }
        }
    }

    setPageColor() {
        let id = store.get('page-color');
        if (id) {
            document.body.className = document.body.className.replace(/page-color-(\w+(-\w+)?)/g, '');
            document.body.classList.add('page-color-' + id);
        }
    }

    bindButtonColor() {
        let instance = this;
        let settingButtonColor = document.querySelector('.setting-button-color');
        if (settingButtonColor) {
            let bgColor = settingButtonColor.querySelectorAll('div');
            for (let i = 0; i < bgColor.length; i++) {
                bgColor[i].addEventListener('click', function () {
                    let classPart = /setting-color-(\w+(-\w+)?)/g.exec(this.className);
                    if (classPart) {
                        store.set('button-color', classPart[1]);
                        instance.setButtonColor();
                    }
                });
            }
        }
    }

    setButtonColor() {
        let id = store.get('button-color');
        if (id) {
            document.body.className = document.body.className.replace(/button-color-(\w+(-\w+)?)/g, '');
            document.body.classList.add('button-color-' + id);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const settings = new Settings();
});

