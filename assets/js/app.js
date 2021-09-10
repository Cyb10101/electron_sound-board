import '../css/app.scss';

import {Ready} from './Ready.js';

const ready = Ready.getInstance();
global.$ = global.jQuery = require('jquery');

// ready.domReady(() => {
//     ready.domComplete(() => {
//     });
// });

require('bootstrap');
require('./fontAwesome.js');

require('./development.js');
require('./sound-board.js');
require('./settings.js');
require('./translate.js');
