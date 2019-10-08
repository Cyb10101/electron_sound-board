'use strict';

const {ipcRenderer, shell} = require('electron');
const Store = require('electron-store');
const store = new Store();
import Sortable from 'sortablejs';
import {predefinedSounds} from './predefined-sounds.js';

class SoundBoard {
    constructor() {
        this.rootDiv = document.querySelectorAll('.sound-board');
        if (this.rootDiv) {
            this.createSoundBoard();
            this.connectMenu();
            this.connectIpc();
            this.connectSoundButtons();
            this.connectSortable();
        }
        this.connectExternalLinks();
    }

    defaultSoundBoard() {
        return [{
            sound: 'ba-da-dum'
        }, {
            sound: 'weapon-science-fiction-01',
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

            let soundStored = predefinedSounds.getSound(item.sound);
            if (item.sound && soundStored) {
                element.setAttribute('data-sound', item.sound);
                if (!item.image && soundStored.image) {
                    item.image = soundStored.image;
                }
                if (!item.image && !item.icon) {
                    item.icon = soundStored.icon;
                }
            } else if (item.soundUser) {
                element.setAttribute('data-soundUser', item.soundUser);
            }
            if (item.image) {
                element.setAttribute('data-image', item.image);
            } else if (item.imageUser) {
                element.setAttribute('data-imageUser', item.imageUser);
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
        let imageUser = button.attributes['data-imageUser'];
        if (image && image.value !== '') {
            let span = document.createElement('span');
            span.classList.add('button-icon');
            let extension = image.value.split('.').pop();
            if (extension === 'svg') {
                span.classList.add('mask');
                span.style.webkitMaskImage = 'url("app://images/sounds/' + image.value + '")';;
                span.style.maskImage = 'url("app://images/sounds/' + image.value + '")';;
            } else {
                span.style.backgroundImage = 'url("app://images/sounds/' + image.value + '")';
            }
            button.appendChild(span);
        } else if (imageUser && imageUser.value !== '') {
            let span = document.createElement('span');
            span.classList.add('button-icon');
            let extension = imageUser.value.split('.').pop();
            if (extension === 'svg') {
                span.classList.add('mask');
                span.style.webkitMaskImage = 'url("user://' + imageUser.value + '")';
                span.style.maskImage = 'url("user://' + imageUser.value + '")';
            } else {
                span.style.backgroundImage = 'url("user://' + imageUser.value + '")';
            }
            button.appendChild(span);
        }

        let sound = button.attributes['data-sound'];
        let soundUser = button.attributes['data-soundUser'];
        let external = false;
        let filename;
        if (sound && sound.value !== '') {
            let soundStored = predefinedSounds.getSound(sound.value);
            filename = 'app://sounds/' + soundStored.sound;
        } else if (soundUser && soundUser.value !== '') {
            external = true;
            filename = 'user://' + soundUser.value;
        }

        if (filename) {
            let audio = new Audio(filename);
            button.addEventListener('click', function () {
                audio.currentTime = 0;
                let volume = parseInt(store.get('volume', 50), 10);
                audio.volume = volume / 100;
                audio.play().catch(function () {
                    console.error('Can\'t play sound: ' + (external ? soundUser.value : sound.value));
                });
            });
        }
    }

    connectSortable() {
        let instance = this;
        let sortable = new Sortable(document.querySelector('.page-sound-board .square-container'), {
            delay: 500,
            animation: 150,
            draggable: '.square-item',
            ghostClass: 'sortable-ghost',
            chosenClass: "sortable-chosen",
            onUpdate: function (event) {
                let board = store.get('board', []);
                instance.arrayMove(board, event.oldIndex, event.newIndex);
                store.set('board', board);
            },
        });
    }

    arrayMove(array, oldIndex, newIndex) {
        if (newIndex >= array.length) {
            let pushEmpty = newIndex - array.length + 1;
            while (pushEmpty--) {
                array.push(undefined);
            }
        }
        array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
        return array; // for testing
    };

}

document.addEventListener('DOMContentLoaded', function () {
    const soundBoard = new SoundBoard();
});
