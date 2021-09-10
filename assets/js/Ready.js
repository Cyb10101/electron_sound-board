import {Singleton} from './Singleton.js';

export class Ready extends Singleton {
    initializeInstance() {
        this.initializeDomComplete();
    }

    initializeDomComplete() {
        let instance = this;
        this.domCompleteCallbacks = [];
        this.domCompleted = false;

        document.onreadystatechange = function () {
            if (document.readyState === 'complete') {
                instance.domCompleted = true;
                if (instance.domCompleteCallbacks.length > 0) {
                    instance.domCompleteCallbacks.forEach(callback => {
                        callback();
                    });
                    instance.domCompleteCallbacks = [];
                }
            }
        }
    }

    domComplete(callback) {
        if (this.domCompleted) {
            callback();
        } else {
            this.domCompleteCallbacks.push(callback);
        }
    }

    domReady(callback) {
        if (callback && typeof callback === 'function') {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                callback();
            } else {
                document.addEventListener('DOMContentLoaded', callback);
            }
        }
    }
}
