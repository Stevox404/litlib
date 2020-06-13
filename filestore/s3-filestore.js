const aws = require('aws-sdk');
aws.config.region = 'us-east-1';
const s3 = new aws.S3();
const fsPromises = require('fs').promises;

/**
 * @type {ConfigObject}
 */
let s3Config;




/**
 * @param {ConfigObject} config 
 */
function init(config) {
    require('dotenv').config();
    baseConfig = {
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION || 'us-east-1',
    }
    config = { ...baseConfig, ...(config || {}) };


    const { bucket, region } = config;

    if (!bucket) {
        throw new Error('Please set the S3_BUCKET env variable');
    }

    aws.config.region = region;
    s3Config = config;
    s3Config.url = `https://${bucket}.s3.amazonaws.com`;


}


/**
 * Get file in S3 Bucket 
 * @param {string} filepath - path to object in Bucket
 */
const getFile = (filepath) => {
    if (!filepath) return null;

    return Promise.resolve().then(() =>
        new Promise((resolve, reject) => {
            const params = {
                Bucket: s3Config.bucket,
                Key: filepath,
            }

            const MIME = getMIME(filepath);


            s3.getObject(params, (err, data) => {
                if (err) {
                    return reject(err);
                }
                data.ContentType = MIME;
                resolve(data)
            });
        })
    );
}

function getMIME(filepath) {
    const ext = /\.(\w+)$/.exec(filepath)[1].toLowerCase();
    if (!ext) {
        return null;
    }
    switch (ext) {
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';

        case 'txt': return 'text/plain';
        case 'pdf': return 'application/pdf';

        case 'mp3': return 'audio/mpeg';
        case 'mp4': return 'video/mpe4';

        case 'doc': return 'application/msword';
        case 'dot': return 'application/msword';

        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'dotx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.template';
        case 'docm': return 'application/vnd.ms-word.document.macroEnabled.12';
        case 'dotm': return 'application/vnd.ms-word.template.macroEnabled.12';

        case 'xls': return 'application/vnd.ms-excel';
        case 'xlt': return 'application/vnd.ms-excel';
        case 'xla': return 'application/vnd.ms-excel';

        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'xltx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.template';
        case 'xlsm': return 'application/vnd.ms-excel.sheet.macroEnabled.12';
        case 'xltm': return 'application/vnd.ms-excel.template.macroEnabled.12';
        case 'xlam': return 'application/vnd.ms-excel.addin.macroEnabled.12';
        case 'xlsb': return 'application/vnd.ms-excel.sheet.binary.macroEnabled.12';

        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pot': return 'application/vnd.ms-powerpoint';
        case 'pps': return 'application/vnd.ms-powerpoint';
        case 'ppa': return 'application/vnd.ms-powerpoint';

        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'potx': return 'application/vnd.openxmlformats-officedocument.presentationml.template';
        case 'ppsx': return 'application/vnd.openxmlformats-officedocument.presentationml.slideshow';
        case 'ppam': return 'application/vnd.ms-powerpoint.addin.macroEnabled.12';
        case 'pptm': return 'application/vnd.ms-powerpoint.presentation.macroEnabled.12';
        case 'potm': return 'application/vnd.ms-powerpoint.template.macroEnabled.12';
        case 'ppsm': return 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12';

        case 'mdb': return 'application/vnd.ms-access';
    }
}


/**
 * Save file to S3
 * @param {string} filepath - path to save object in bucket
 * @param {{path: string}} file - File to be read. 
 *  Can pass "path" property for fs path or actual data.
 */
const saveFile = (filepath, file) => {
    return new Promise(async (resolve, reject) => {
        if (!filepath || !file) return null;
        const data = file.path ? await fsPromises.readFile(file.path) : file;
        filepath = String(filepath).replace(/^\//, '')

        const params = {
            Bucket: s3Config.bucket,
            Key: filepath,
            Body: data,
            ACL: 'public-read',
            ContentDisposition: 'inline',
        };

        const mime = getMIME(filepath);
        if (mime) {
            params.ContentType = mime;
        }


        s3.putObject(params, (err) => {
            if (err) {
                console.error('Error in saving file: ' + filepath + ' in bucket.');
                reject(err);
            }
            resolve(`${s3Config.url}/${filepath}`);
        });
    })
};


/**
 * Delete object in S3 bucket
 * @param {string} filepath - path to object in Bucket
 */
const deleteFile = (filepath) => {
    if (!filepath) return null;

    return Promise.resolve().then(() =>
        new Promise((resolve, reject) => {
            // Check if fully qualified filepath
            const regex = RegExp(`^${s3Config.url}/`);
            filepath = filepath.replace(regex, '');
            
            const params = {
                Bucket: s3Config.bucket,
                Key: filepath,
            };
            s3.deleteObject(params, (err) => {
                if (err) return reject(err);
                resolve();
            });
        })
    );
};


/**
 * Initialize S3 object.
 * Optional config object may be passed, 
 * otherwise uses already initialized S3 object.
 * If none already exists, it is initalized using env variables 
 * (See env.sample)
 * @param {ConfigObject=} config 
 */
module.exports = (config) => {
    if (config || !s3Config) init(config);

    return {
        getFile, saveFile, deleteFile,
        /**@type {S3Url} */
        url: s3Config.url,
        /**@type {S3Url} */
        path: s3Config.url,
        s3
    }
}




/**@typedef {string} S3Url - Base url to access bucket */
/**
 * @typedef ConfigObject
 * @property {string} bucket - Name of S3 bucket to use
 * @property {string} region - AWS S3 bucket instance region
 * @property {string} region - AWS S3 bucket instance region
 */