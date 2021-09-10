'use strict';

import {environment} from './environment.js';
const {ipcRenderer} = require('electron');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();

class Development {
    constructor() {
        this.devToolbarInitialize();
        this.reloadSamePage(30);
    }

    reloadSamePage(seconds = 30) {
        if (environment.isDevelopment()) {
            this.reloadPageIntervall = window.setInterval(function () {
                if (store.get('devAutoReload', false)) {
                    document.location.reload();
                }
            }, 1000 * seconds);
        }
    }

    devToolbarInitialize() {
        if (environment.isDevelopment()) {
            this.devToolbarLoad();
        }
    }

    devToolbarLoad() {
        let instance = this;
        fs.readFile('public/dev-toolbar.html', 'utf-8', (error, data) => {
            if (error) {
                console.error('An error ocurred reading the file :' + error.message);
                return;
            }
            instance.devToolbarAppend(data);
            instance.devToolbarBind();
        });
    }
    devToolbarAppend(content) {
        if (content && content !== '') {
            let div = document.createElement('div');
            div.innerHTML = content;
            document.body.appendChild(div.querySelector('div'));
        }
    }
    devToolbarBind() {
        let instance = this;
        this.devToolbar = document.querySelector('.dev-toolbar');
        if (this.devToolbar) {
            if (store.get('devToolbar', false)) {
                this.devToolbarToggle();
            }
            this.devToolbar.querySelector('.show-button').addEventListener('click', function (event) {
                event.preventDefault();
                instance.devToolbarToggle();
            });
            this.devToolbar.querySelector('.hide-button').addEventListener('click', function (event) {
                event.preventDefault();
                instance.devToolbarToggle();
            });
            this.devToolbar.querySelectorAll('.dev-toolbar-icon').forEach(function (obj) {
                obj.addEventListener('click', function (event) {
                    event.preventDefault();
                    let isHover = this.parentNode.classList.contains('hover');
                    this.parentNode.parentNode.querySelectorAll('.dev-toolbar-block.hover').forEach(function (obj2) {
                        obj2.classList.remove('hover');
                    });
                    if (!isHover) {
                        this.parentNode.classList.toggle('hover');
                    }
                });
            });

            this.devToolbarAddSystemInfo();
            this.devToolbarAddDevelopmentInfo()
            this.devToolbarUpdateAutoReload();
            this.devToolbar.querySelector('.dev-toolbar-block.settings .devAutoReload').addEventListener('click', function (event) {
                store.set('devAutoReload', !store.get('devAutoReload', false));
                event.preventDefault();
                instance.devToolbarUpdateAutoReload();
            });
        }
    }

    createElement(html = '', tagName = 'div') {
        let element = document.createElement(tagName);
        element.innerHTML = html;
        return element;
    }

    devToolbarAddSystemInfo() {
        let system = this.devToolbar.querySelector('.dev-toolbar-block.system .dev-toolbar-info');
        system.appendChild(this.createElement('<b>Node</b><span>' + global.process.versions.node + '</span>'));
        system.appendChild(this.createElement('<b>Electron</b><span>' + global.process.versions.electron + '</span>'));
        system.appendChild(this.createElement('<b>Chrome</b><span>' + global.process.versions.chrome + '</span>'));
        ipcRenderer.invoke('config', ['userData']).then((userData) => {
            system.appendChild(this.createElement('<b>User data</b><span>' + userData + '</span>'));
        });
    }

    devToolbarAddDevelopmentInfo() {
        let development = this.devToolbar.querySelector('.dev-toolbar-block.development .dev-toolbar-info');
        development.appendChild(this.createElement('<b>window.devicePixelRatio</b><span class="status">' + window.devicePixelRatio + '</span>'));
    }

    devToolbarUpdateAutoReload() {
        let isAutoReload = store.get('devAutoReload', false);
        let span = this.devToolbar.querySelector('.dev-toolbar-block.settings .devAutoReload span');
        span.innerHTML = (isAutoReload ? 'enabled' : 'disabled');

        span.classList.remove('bg-green', 'bg-red');
        if (isAutoReload) {
            span.classList.add('bg-green');
        } else {
            span.classList.add('bg-red');
        }
    }

    devToolbarToggle() {
        let devToolbarShowButton = this.devToolbar.querySelector('.show-button');
        if (devToolbarShowButton.style.display === 'none') {
            this.devToolbar.querySelector('.dev-toolbar-content').style.display = 'none';
            this.devToolbar.querySelector('.dev-toolbar-clearer').style.display = 'none';
            devToolbarShowButton.style.display = 'block';
            store.set('devToolbar', false);
        } else {
            this.devToolbar.querySelector('.dev-toolbar-content').style.display = 'block';
            this.devToolbar.querySelector('.dev-toolbar-clearer').style.display = 'block';
            devToolbarShowButton.style.display = 'none';
            store.set('devToolbar', true);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const development = new Development();
});
