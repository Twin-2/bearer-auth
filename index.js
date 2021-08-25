'use strict';

const server = require('./src/server.js')
require('dotenv').config();

// Start up DB Server
const { db } = require('./src/auth/models/index.js');
db.sync()
    .then(() => {

        // Start the web server
        server.start(process.env.PORT);
    });