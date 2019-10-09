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
            this.createSoundBoardEdit();
            this.addTestSoundButtons();
            this.createCopyrightSoundLicencesAndAddSounds();
            this.connectMenu();
            this.connectIpc();
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

    createElementSoundButtonByItem(item, tagName = 'div') {
        let element = document.createElement(tagName);
        element.className = 'square-item button-sound';

        let soundStored = predefinedSounds.getSound(item.sound);
        soundStored = {...soundStored, ...item}; // Merge sound objects
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

        this.configureSoundButton(element);
        return element;
    }

    createSoundBoard() {
        let board = store.get('board', []);
        if (board.length === 0) {
            store.set('board', this.defaultSoundBoard());
            board = store.get('board', []);
        }

        let container = document.querySelector('.page-sound-board .square-container');
        container.innerHTML = '';
        for (let item of board) {
            container.appendChild(this.createElementSoundButtonByItem(item));
        }
    }

    createElementLicenceData(appendElement, header, linkText, linkUrl) {
        let elHeader = document.createElement('b');
        elHeader.innerText = header + ':';
        appendElement.appendChild(elHeader);

        let space = document.createTextNode(' ');
        appendElement.appendChild(space);

        let elLink = document.createElement('a');
        elLink.className = 'external';
        elLink.href = linkUrl;
        elLink.innerText = linkText;
        appendElement.appendChild(elLink);

        let elNewLine = document.createElement('br');
        appendElement.appendChild(elNewLine);
    }

    addCopyrightSoundLicence(item, sound) {
        item.sound = sound;
        item.icon = 'fas fa-volume-up';
        item.image = null;

        let div = document.createElement('div');
        div.className = 'col-lg-3 col-md-4 col-sm-6 col-12 mb-3';

        let header = document.createElement('h5');
        header.appendChild(this.createElementSoundButtonByItem(item, 'div'));
        header.appendChild(document.createTextNode(' ' + sound));
        div.appendChild(header);

        this.createElementLicenceData(div, 'Author', item.soundLicence.author, item.soundLicence.origin);
        this.createElementLicenceData(div, 'License', item.soundLicence.name, item.soundLicence.url);
        document.querySelector('.page-copyright .sound-licences').appendChild(div);
    }

    addCopyrightImageLicence(item) {
        let div = document.createElement('div');
        div.className = 'col-lg-3 col-md-4 col-sm-6 col-12 mb-3';

        let header = document.createElement('h5');
        let image = document.createElement('img');
        image.src = 'app://images/sounds/' + item.image;
        image.width = 24;
        image.height = 24;
        header.appendChild(image);
        header.appendChild(document.createTextNode(' ' + item.image));
        div.appendChild(header);

        this.createElementLicenceData(div, 'Author', item.imageLicence.author, item.imageLicence.origin);
        this.createElementLicenceData(div, 'License', item.imageLicence.name, item.imageLicence.url);
        document.querySelector('.page-copyright .image-licences').appendChild(div);
    }

    createCopyrightSoundLicencesAndAddSounds() {
        let sameImage = [];
        let ignoreImageLicence = ['Font Awesome Free'];
        let addSounds = document.querySelector('.page-edit-sounds .add-sounds');
        addSounds.innerHTML = '';

        for (let sound in predefinedSounds.getSounds()) {
            let item = predefinedSounds.getSound(sound);
            if (item.image && !sameImage.includes(item.image) && !ignoreImageLicence.includes(item.imageLicence.id)) {
                sameImage.push(item.image);
                this.addCopyrightImageLicence(item);
            }

            item.sound = sound;
            addSounds.appendChild(this.createElementSoundBoardEdit(item, 'add'));
            this.addCopyrightSoundLicence(item, sound);
        }
    }

    connectExternalLinks() {
        let externalLinks = document.querySelectorAll('a.external');
        for (let i = 0; i < externalLinks.length; i++) {
            externalLinks[i].addEventListener('click', function (event) {
                event.preventDefault();
                let link = this.href;
                shell.openExternal(link).catch(function () {
                    console.error('Can\'t open external link.');
                });
            });
        }
    }

    connectMenu() {
        let instance = this;

        document.querySelector('.menu .page-back').addEventListener('click', function () {
            instance.switchPage('.page-sound-board');
        });
        document.querySelector('.menu .edit-sounds').addEventListener('click', function () {
            instance.switchPage('.page-edit-sounds');
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

    addTestSoundButtons() {
        let instance = this;
        document.querySelectorAll('.test-sound').forEach(function (button) {
            let soundButton = instance.createElementSoundButtonByItem({sound: 'ba-da-dum', icon: 'fas fa-volume-up'});
            button.classList.forEach(function (className) {
               soundButton.classList.add(className);
            });
            button.parentNode.replaceChild(soundButton, button);
        });
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

        this.addSoundButtonEvent(button);
    }

    addSoundButtonEvent(button) {
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
        let editBoard = document.querySelector('.page-edit-sounds .edit-board');
        let sortable = new Sortable(editBoard, {
            delay: 0,
            animation: 150,
            draggable: '.list-group-item',
            handle: '.move',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            onUpdate: function (event) {
                let board = store.get('board', []);
                instance.arrayMove(board, event.oldIndex, event.newIndex);
                store.set('board', board);
                instance.createSoundBoard();
            },
        });

        document.querySelectorAll('.page-edit-sounds .add-sounds .add-sound').forEach(function (item) {
            item.addEventListener('click', function () {
                let parent = this.parentNode;
                let newSound = document.createElement('li');
                newSound.className = 'list-group-item';
                newSound.innerText = parent.innerText;
                editBoard.appendChild(newSound);
            });
        });
    }

    createElementSoundBoardEdit(item, type = 'edit') {
        let instance = this;
        let editBoard = document.querySelector('.page-edit-sounds .edit-board');

        let element = document.createElement('li');
        element.className = 'list-group-item';
        element.setAttribute('data-sound', item.sound);

        let soundButton = this.createElementSoundButtonByItem(item);
        element.appendChild(soundButton);
        element.appendChild(document.createTextNode(' ' + item.sound + ' '));

        if (type === 'edit') {
            let newSoundMove = document.createElement('i');
            newSoundMove.className = 'fas fa-bars float-right move';
            element.appendChild(newSoundMove);

            let newSoundTrash = document.createElement('i');
            newSoundTrash.className = 'fas fa-trash float-right trash';
            newSoundTrash.addEventListener('click', function () {
                let nodes = Array.prototype.slice.call(this.parentNode.parentNode.children);
                let trashId = nodes.indexOf(this.parentNode);

                let board = store.get('board', []);
                board.splice(trashId, 1);
                store.set('board', board);

                let container = document.querySelector('.page-sound-board .square-container');
                container.removeChild(container.children[trashId]);
                this.parentNode.parentNode.removeChild(this.parentNode);

            });
            element.appendChild(newSoundTrash);
        } else {
            let newSoundAdd = document.createElement('i');
            newSoundAdd.className = 'fas fa-plus-square float-right add';
            newSoundAdd.addEventListener('click', function () {
                let sound = this.parentNode.getAttribute('data-sound');
                let soundItem = predefinedSounds.getSound(sound);
                soundItem.sound = sound;
                let button = instance.createElementSoundBoardEdit(soundItem);
                editBoard.appendChild(button);

                let buttonBoard = instance.createElementSoundButtonByItem(soundItem);
                let container = document.querySelector('.page-sound-board .square-container');
                container.appendChild(buttonBoard);

                let board = store.get('board', []);
                board.push({sound: sound});
                store.set('board', board);
            });
            element.appendChild(newSoundAdd);
        }
        return element;
    }

    createSoundBoardEdit() {
        let board = store.get('board', []);

        let container = document.querySelector('.page-edit-sounds .edit-board');
        container.innerHTML = '';
        for (let item of board) {
            container.appendChild(this.createElementSoundBoardEdit(item));
        }
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
