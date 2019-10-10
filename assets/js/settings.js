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
        let modifierCombined = '';
        if (store.get('modifier-ctrl', true)) {
            modifierCombined += 'Ctrl + ';
        }
        if (store.get('modifier-shift', true)) {
            modifierCombined += 'Shift + ';
        }
        if (store.get('modifier-alt', false)) {
            modifierCombined += 'Alt + ';
        }
        modifierCombined += '1';

        let modifierExamples = document.querySelectorAll('.setting-modifier-example');
        for (let i = 0; i < modifierExamples.length; i++) {
            modifierExamples[i].innerHTML = modifierCombined;
        }

        document.querySelector('#setting-modifier-ctrl').checked = store.get('modifier-ctrl', true);
        document.querySelector('#setting-modifier-shift').checked = store.get('modifier-shift', true);
        document.querySelector('#setting-modifier-alt').checked = store.get('modifier-alt', false);

        let amount = document.querySelectorAll('.page-sound-board .button-sound').length;
        ipcRenderer.send('setGlobalShortcuts', amount);
    }

    bindAppSettings() {
        let instance = this;
        document.querySelector('#settings-app-start-minimized').addEventListener('change', function () {
            store.set('app-start-minimized', this.checked);
        });

        document.querySelector('#setting-app-frame').addEventListener('change', function () {
            store.set('app-frame', this.checked);
            $('#appFrame').modal();
        });
        document.querySelector('.setting-app-frame-restart').addEventListener('click', function () {
            ipcRenderer.send('app', {do: 'restart'});
        });
        $('#appFrame').on('hidden.bs.modal', function () {
            store.set('app-frame', !store.get('app-frame', false));
            instance.setAppSettings();
        });

        document.querySelectorAll('[name="setting-app-tray-instead-taskbar"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                store.set('app-tray-instead-taskbar', (this.value === 'tray'));
                ipcRenderer.send('app', {do: 'tray-instead-taskbar'});
            });
        });
    }

    setAppSettings() {
        document.querySelector('#settings-app-start-minimized').checked = store.get('app-start-minimized', false);

        let isFrame = store.get('app-frame', false);
        document.querySelector('#setting-app-frame').checked = isFrame;
        document.querySelector('.menu .close').style.display = (isFrame ? 'none' : 'inline-block');
        document.querySelector('.menu .maximize').style.display = (isFrame ? 'none' : 'inline-block');
        document.querySelector('.menu .minimize').style.display = (isFrame ? 'none' : 'inline-block');
        document.querySelector('.menu .window-default').style.display = (isFrame ? 'none' : 'inline-block');
        document.querySelector('#setting-app-version').innerHTML = remote.app.getVersion();

        if (store.get('app-tray-instead-taskbar', true)) {
            document.querySelector('#setting-app-tray-instead-taskbar_tray').checked = true;
        } else {
            document.querySelector('#setting-app-tray-instead-taskbar_taskbar').checked = true;
        }
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
            // Lazy method to prevent errors for a deleted config file
            store.set('nothing', 'How lazy...');
            store.delete('nothing');

            store.openInEditor();
        });
        document.querySelector('.setting-open-user-data').addEventListener('click', function () {
            shell.openItem(remote.app.getPath('userData'));
        });
        document.querySelectorAll('.setting-reset-app').forEach(function(button) {
            button.addEventListener('click', function () {
                let action = (this.getAttribute('data-action') === 'restart' ? 'restart' : 'close');
                ipcRenderer.send('app', {do: 'reset', action: action});
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const settings = new Settings();
});

