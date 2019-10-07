'use strict';

const {ipcRenderer, remote, shell} = require('electron');
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

        this.bindAppSettings();
        this.setAppSettings();

        this.bindDangerZone();
        this.bindRestartApp();
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
            instance.setModifier();
        });

        document.querySelector('#setting-modifier-shift').addEventListener('change', function () {
            store.set('modifier-shift', this.checked);
            instance.setModifier();
        });

        document.querySelector('#setting-modifier-alt').addEventListener('change', function () {
            store.set('modifier-alt', this.checked);
            instance.setModifier();
        });
    }

    setModifier() {
        document.querySelector('#setting-modifier-ctrl').checked = store.get('modifier-ctrl', true);
        document.querySelector('#setting-modifier-shift').checked = store.get('modifier-shift', true);
        document.querySelector('#setting-modifier-alt').checked = store.get('modifier-alt', false);

        let amount = document.querySelectorAll('.page-sound-board .button-sound').length;
        ipcRenderer.send('setGlobalShortcuts', amount);
    }

    bindAppSettings() {
        document.querySelector('#setting-app-frame').addEventListener('change', function () {
            store.set('app-frame', this.checked);
            $('#appRestart').modal();
        });
    }

    setAppSettings() {
        let isFrame = store.get('app-frame', false);
        document.querySelector('#setting-app-frame').checked = isFrame;
        document.querySelector('.menu .close').style.display = (isFrame ? 'none' : 'inline-block');
        document.querySelector('.menu .maximize').style.display = (isFrame ? 'none' : 'inline-block');
        document.querySelector('.menu .minimize').style.display = (isFrame ? 'none' : 'inline-block');
        document.querySelector('.menu .window-default').style.display = (isFrame ? 'none' : 'inline-block');
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
        let id = store.get('page-color', '0-page');
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
        let id = store.get('button-color', '0-button');
        if (id) {
            document.body.className = document.body.className.replace(/button-color-(\w+(-\w+)?)/g, '');
            document.body.classList.add('button-color-' + id);
        }
    }

    bindDangerZone() {
        document.querySelector('.setting-store-editor').addEventListener('click', function () {
            store.openInEditor();
        });
        document.querySelector('.setting-open-user-data').addEventListener('click', function () {
            shell.openItem(remote.app.getPath('userData'));
        });
        document.querySelector('.setting-reset-app').addEventListener('click', function () {
            ipcRenderer.send('app', 'reset');
        });
    }

    bindRestartApp() {
        document.querySelector('.setting-restart-app').addEventListener('click', function () {
            ipcRenderer.send('app', 'restart');
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const settings = new Settings();
});

