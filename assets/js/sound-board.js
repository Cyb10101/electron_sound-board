'use strict';

const {ipcRenderer, remote, shell} = require('electron');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
import Sortable from 'sortablejs';
import {predefinedSounds} from './predefined-sounds.js';

class SoundBoard {
    constructor() {
        this.initializeUserData();
        this.createSoundBoard();
        this.createSoundBoardEdit();
        this.addTestSoundButtons();
        this.createCopyrightSoundLicencesAndAddSounds();
        this.connectMenu();
        this.connectIpc();
        this.connectSortable();
        this.bindAddOwnSound();
        this.connectExternalLinks();
    }

    initializeUserData() {
        this.userData = remote.app.getPath('userData');
        this.userDataSounds = this.userData + '/sounds';
        this.userDataImages = this.userData + '/images';
        if (!fs.existsSync(this.userDataSounds)) {
            fs.mkdirSync(this.userDataSounds);
        }
        if (!fs.existsSync(this.userDataImages)) {
            fs.mkdirSync(this.userDataImages);
        }
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
        document.querySelector('.menu .add-own-sound').addEventListener('click', function () {
            instance.switchPage('.page-add-own-sound');
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
        let container = document.querySelector('.page-sound-board .square-container');
        ipcRenderer.on('global-shortcut', function(event, arg) {
            let soundButton = container.children[arg];
            soundButton.dispatchEvent(new MouseEvent('click'));
            soundButton.classList.add('active');
            window.setTimeout(function () {
                soundButton.classList.remove('active');
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
                span.style.maskImage = 'url("app://images/sounds/' + image.value + '")';
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
                span.style.webkitMaskImage = 'url("user://images/' + imageUser.value + '")';
                span.style.maskImage = 'url("user://images/' + imageUser.value + '")';
            } else {
                span.style.backgroundImage = 'url("user://images/' + imageUser.value + '")';
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
            filename = 'user://sounds/' + soundUser.value;
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

    getNameFromSoundItem(soundItem) {
        let name = 'Unnamed sound';
        if (soundItem.hasOwnProperty('name')) {
            name = soundItem.name;
        } else if (soundItem.hasOwnProperty('sound')) {
            name = soundItem.sound;
        } else if (soundItem.hasOwnProperty('soundUser')) {
            name = soundItem.soundUser;
        }
        return name;
    }

    createElementSoundBoardEdit(item, type = 'edit') {
        let instance = this;

        let element = document.createElement('li');
        element.className = 'list-group-item';
        element.setAttribute('data-sound', item.sound);

        let soundButton = this.createElementSoundButtonByItem(item);
        element.appendChild(soundButton);
        element.appendChild(document.createTextNode(' ' + this.getNameFromSoundItem(item) + ' '));

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
                let soundTrash = board[trashId];
                if (soundTrash.soundUser && fs.existsSync(instance.userDataSounds + '/' + soundTrash.soundUser)) {
                    fs.unlinkSync(instance.userDataSounds + '/' + soundTrash.soundUser);
                }
                if (soundTrash.imageUser && fs.existsSync(instance.userDataImages + '/' + soundTrash.imageUser)) {
                    fs.unlinkSync(instance.userDataImages + '/' + soundTrash.imageUser);
                }
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

                instance.addSoundItemToBoard(soundItem, {sound: sound});
            });
            element.appendChild(newSoundAdd);
        }
        return element;
    }

    addSoundItemToBoard(soundItem, overrideStore = null) {
        let button = this.createElementSoundBoardEdit(soundItem);
        document.querySelector('.page-edit-sounds .edit-board').appendChild(button);

        let buttonBoard = this.createElementSoundButtonByItem(soundItem);
        document.querySelector('.page-sound-board .square-container').appendChild(buttonBoard);

        let board = store.get('board', []);
        board.push((overrideStore ? overrideStore : soundItem));
        store.set('board', board);
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

    bindAddOwnSound() {
        let instance = this;
        let form = document.getElementById('add-own-sound');

        form.sound.addEventListener('change', function () {
            let value = 'Sound file';
            if (form.sound.files.length > 0) {
                value = form.sound.files[0].name;
            }
            this.parentNode.querySelector('.custom-file-label').innerHTML = value;
        });

        form.image.addEventListener('change', function () {
            let value = 'Sound file';
            if (form.image.files.length > 0) {
                value = form.image.files[0].name;
            }
            this.parentNode.querySelector('.custom-file-label').innerHTML = value;
        });

        form.addEventListener('submit', function processForm(event) {
            event.preventDefault();

            if (form.sound.files.length > 0) {
                let item = {};
                let soundFileName = form.sound.files[0].name;
                let soundFileExtension = soundFileName.split('.').pop();
                let soundFilePath = form.sound.files[0].path;
                let newSoundFileName = instance.generateFileCode(instance.userDataSounds, soundFileExtension);
                item.name = soundFileName;
                item.soundUser = newSoundFileName;

                fs.copyFile(soundFilePath, instance.userDataSounds + '/' + newSoundFileName, function(error) {
                    if (error) {
                        throw error;
                    }
                });

                let name = form.name.value;
                if (name) {
                    item.name = name;
                }

                let icon = form.icon.value;
                if (icon) {
                    item.icon = icon;
                }

                if (form.image.files.length > 0) {
                    let imageFileName = form.image.files[0].name;
                    let imageFileExtension = imageFileName.split('.').pop();
                    let imageFilePath = form.image.files[0].path;
                    let newImageFileName = instance.generateFileCode(instance.userDataImages, imageFileExtension);
                    item.imageUser = newImageFileName;

                    fs.copyFile(imageFilePath, instance.userDataImages + '/' + newImageFileName, function(error) {
                        if (error) {
                            throw error;
                        }
                    });
                }

                instance.addSoundItemToBoard(item);
                instance.switchPage('.page-edit-sounds');
                form.sound.parentNode.querySelector('.custom-file-label').innerHTML = 'Sound file';
                form.image.parentNode.querySelector('.custom-file-label').innerHTML = 'Image file';
                form.reset();
            }

            return false; // Prevent the default form behavior
        });

    }

    generateFileCode(path, extension) {
        let counter = 0;
        while (counter < 100) {
            let code = this.generateRandomString() + '.' + extension;
            try {
                if (!fs.existsSync(path + '/' + code)) {
                    return code;
                }
            } catch(err) {
                console.error(err)
            }
            counter++;
        }
        return '';
    }

    generateRandomString(length = 12, characters = '') {
        let string = '';
        if (!characters || characters === '') {
            characters = this.jsRange('A','Z') + this.jsRange('a','z') + this.jsRange('0','9') + '_' + '-';
        }
        let maxNumber = characters.length - 1;
        for (let i = 0; i < length; i++) {
            let randomNumber = this.mt_rand(0, maxNumber);
            string += characters[randomNumber];
        }
        return string;
    }

    jsRange(start, end) {
        return String.fromCharCode(...[...Array(end.charCodeAt(0) - start.charCodeAt(0) + 1).keys()].map(i => i + start.charCodeAt(0)));
    }

    mt_rand(min, max) {
        let argc = arguments.length;
        if (argc === 0) {
            min = 0;
            max = 2147483647;
        } else if (argc === 1) {
            throw new Error('Warning: mt_rand() expects exactly 2 parameters, 1 given');
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const soundBoard = new SoundBoard();
});
