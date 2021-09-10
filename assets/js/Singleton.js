export class Singleton {
    constructor() {
    }
    static getInstance() {
        let name = this.name;
        if (typeof this._instance === 'undefined') {
            this._instance = {};
        }

        if (!this._instance.hasOwnProperty(name)) {
            this._instance[name] = new this();
            if (typeof this._instance[name].initializeInstance === 'function') {
                this._instance[name].initializeInstance();
            }
        }

        return this._instance[name];
    }
}

