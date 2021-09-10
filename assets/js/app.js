import '../css/app.scss';

global.$ = global.jQuery = require('jquery');

require('popper.js');
require('bootstrap');
require('./fontAwesome.js');

require('./development.js');
require('./sound-board.js');
require('./settings.js');
require('./translate.js');
