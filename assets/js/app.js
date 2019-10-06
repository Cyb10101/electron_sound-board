import '../css/app.scss';

global.$ = global.jQuery = require('jquery');

require('popper.js');
require('bootstrap');

require('./development.js');
require('./sound-board.js');
require('./settings.js');
