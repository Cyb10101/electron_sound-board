'use strict';

const {ipcRenderer, remote, shell} = require('electron');
const Store = require('electron-store');
const store = new Store();

class SoundBoard {
    constructor() {
        this.rootDiv = document.querySelectorAll('.sound-board');
        if (this.rootDiv) {
            this.createSoundBoard();
            this.connectMenu();
            this.connectIpc();
            this.connectSoundButtons();
        }
        this.connectExternalLinks();
    }

    mapSound(name) {
        switch (name) {
            case 'ba-da-dum': return {sound: 'ba-da-dum.wav', icon: 'fas fa-drum'};
        }
        return null;
    }

    defaultSoundBoard() {
        return [{
            sound: 'ba-da-dum'
        }];
    }

    createSoundBoard() {
        let board = store.get('board', []);
        if (board.length === 0) {
            store.set('board', this.defaultSoundBoard());
            board = store.get('board', []);
        }

        for (let item of board) {
            let element = document.createElement('div');
            element.className = 'square-item button-sound';
            if (item.sound && this.mapSound(item.sound)) {
                element.setAttribute('data-sound', item.sound);
                if (!item.icon) {
                    item.icon = this.mapSound(item.sound).icon;
                }
            } else if (item.file) {
                element.setAttribute('data-file', item.file);
            }
            if (item.image) {

            } else {
                if (!item.icon) {
                    item.icon = 'fas fa-volume-up';
                }

                let icon = document.createElement('i');
                icon.className = item.icon;
                element.appendChild(icon);
            }
            document.querySelector('.page-sound-board .square-container').appendChild(element);
        }
    }

    connectExternalLinks() {
        let externalLinks = document.querySelectorAll('a.external');
        for (let i = 0; i < externalLinks.length; i++) {
            externalLinks[i].addEventListener('click', function (event) {
                event.preventDefault();
                let link = this.href;
                shell.openExternal(link).catch(function () {
                    console.log('Can\'t open external link.');
                });
            });
        }
    }

    connectMenu() {
        let instance = this;

        document.querySelector('.menu .page-back').addEventListener('click', function () {
            instance.switchPage('.page-sound-board');
        });

        document.querySelector('.menu .copyright').addEventListener('click', function () {
            instance.switchPage('.page-copyright');
        });

        document.querySelector('.menu .help').addEventListener('click', function () {
            instance.switchPage('.page-help');
        });

        document.querySelector('.menu .settings').addEventListener('click', function () {
            instance.switchPage('.page-settings');
        });

        document.querySelector('.menu .close').addEventListener('click', function () {
            ipcRenderer.send('mainWindow', 'close');
        });
        document.querySelector('.menu .maximize').addEventListener('click', function () {
            ipcRenderer.send('mainWindow', 'maximize');
        });
        document.querySelector('.menu .minimize').addEventListener('click', function () {
            ipcRenderer.send('mainWindow', 'minimize');
        });
    }

    connectIpc() {
        let instance = this;
        ipcRenderer.on('global-shortcut', function(event, arg) {
            instance.soundButtons[arg].dispatchEvent(new MouseEvent('click'));
            instance.soundButtons[arg].classList.add('active');
            window.setTimeout(function () {
                instance.soundButtons[arg].classList.remove('active');
            }, 100);
        });

        ipcRenderer.on('switch-page', function(event, arg) {
            instance.switchPage(arg);
        });
    }

    switchPage(pageSelector) {
        let pageFound = document.querySelector(pageSelector);
        if (pageFound) {
            if (pageFound.classList.contains('page-sound-board')) {
                document.querySelector('.menu .page-back').style.display = 'none';
                document.querySelector('.menu .brand').style.display = 'block';
            } else {
                document.querySelector('.menu .page-back').style.display = 'block';
                document.querySelector('.menu .brand').style.display = 'none';
            }

            let pages = document.querySelectorAll('.page');
            for (let i = 0; i < pages.length; i++) {
                pages[i].style.display = 'none';
            }
            document.querySelector(pageSelector).style.display = 'block';
        }
    }

    connectSoundButtons() {
        this.soundButtons = document.querySelectorAll('.button-sound');
        for (let i = 0; i < this.soundButtons.length; i++) {
            this.configureSoundButton(this.soundButtons[i]);
        }
    }

    configureSoundButton(button) {
        let image = button.attributes['data-image'];
        if (image && image.value !== '') {
            let span = document.createElement('span');
            span.classList.add('button-icon');
            span.style.backgroundImage = 'url("app://images/sounds/' + image.value + '")';
            button.appendChild(span);
        }

        let sound = button.attributes['data-sound'];
        let file = button.attributes['data-file'];
        let external = false;
        let filename;
        if (sound && sound.value !== '') {
            filename = 'app://sounds/' + this.mapSound(sound.value).sound;
        } else if (file && file.value !== '') {
            external = true;
            filename = 'user://' + file.value;
        }

        if (filename) {
            let audio = new Audio(filename);
            button.addEventListener('click', function () {
                audio.currentTime = 0;
                let volume = parseInt(store.get('volume', 50), 10);
                audio.volume = volume / 100;
                audio.play().catch(function () {
                    console.error('Can\'t play sound: ' + (external ? file.value : sound.value));
                });
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const soundBoard = new SoundBoard();
});
