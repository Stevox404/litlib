const cipher = require('./cipher');
const mailer = require('./mailer');
const utils = require('./utils');

module.exports = { 
    lfs: require('./lfs/s3'),
    ldb: require('./ldb'),
    cipher, mailer, ...utils
}

this.db.Db