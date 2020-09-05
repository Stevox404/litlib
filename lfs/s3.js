const aws = process.env.NODE_ENV === 'test' ?
    require('mock-aws-s3') : require('aws-sdk');
aws.config.region = 'us-east-1';
const fsPromises = require('fs').promises;
require('dotenv').config();

let initializedS3;

module.exports.S3 = S3;

/**
 * Constructor for s3 fs.
 * @param {S3Config} newConfig 
 */
function S3(newConfig) {
    /**@type {{awsS3: AWS.S3}} */
    let awsS3, config;
    if (newConfig) {
        ({ awsS3, config } = init(newConfig));
    } else {
        ({ awsS3, config } = initializedS3);
    }
    if (!awsS3 || !config) {
        throw new Error('S3 not initialized');
    }

    /**
     * @type {string} Base url to s3 bucket
     */
    this.url = config.url

    /**
     * Get file in S3 Bucket 
     * @param {string} filepath - path to object in Bucket
     * @param {import('aws-sdk/clients/s3').GetObjectRequest} s3GetParams
     * @returns {Promise<import('aws-sdk/clients/s3').GetObjectOutput>} data
     */
    this.getFile = function (filepath, s3GetParams) {
        return new Promise((resolve, reject) => {
            // Check if fully qualified filepath
            const regex = RegExp(`^${config.url}/`);
            filepath = filepath.replace(regex, '');

            const params = {
                Bucket: config.bucket,
                Key: filepath,
                ...s3GetParams,
            };
            const MIME = getMIME(filepath);
            awsS3.getObject(params, (err, data) => {
                if (err) return reject(err);
                data.ContentType = MIME;
                resolve(data);
            });
        });
    }

    /**
     * Save file to S3
     * @param {string} filepath - path to save object in bucket
     * @param {{path: string}} file - File to be read. 
     *  Can pass "path" property for fs path or actual data.
     * @param {import('aws-sdk/clients/s3').PutObjectRequest} s3PutParams
     *  Defaults to public-read
     * @returns {Promise<string>} - File url
     */
    this.saveFile = function (filepath, file, s3PutParams) {
        return new Promise(async (resolve, reject) => {
            if (!filepath || !file) return null;
            const data = file.path ? await fsPromises.readFile(file.path) : file;
            filepath = String(filepath).replace(/^\//, '')
            const params = {
                Bucket: config.bucket,
                Key: filepath,
                Body: data,
                ACL: 'public-read',
                ContentDisposition: 'inline',
                ...s3PutParams,
            };

            const mime = getMIME(filepath);
            if (mime) params.ContentType = mime;
            
            awsS3.putObject(params, err => {
                if (err) return reject(err);
                resolve(`${config.url}/${filepath}`);
            });
        })
    }

    /**
     * Delete object in S3 bucket
     * @param {string} filepath - path to object in Bucket
     * @param {import('aws-sdk/clients/s3').DeleteObjectRequest} s3PutParams
     * @returns {Promise<import('aws-sdk/clients/s3').DeleteObjectOutput>}
     */
    this.deleteFile = function (filepath) {
        if (!filepath) return null;
        new Promise((resolve, reject) => {
            // Check if fully qualified filepath
            const regex = RegExp(`^${config.url}/`);
            filepath = filepath.replace(regex, '');

            const params = {
                Bucket: config.bucket,
                Key: filepath,
            };
            awsS3.deleteObject(params, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        })
    };

}
S3.init = function (newConfig) {
    initializedS3 = init(newConfig);
};



/**
 * @param {S3Config} newConfig 
 */
function init(newConfig) {
    const config = {
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION,
        ...newConfig,
    }
    if (!config.bucket) {
        throw new Error('Please set the S3_BUCKET');
    }
    config.url = `https://${config.bucket}.s3.amazonaws.com`;
    const awsS3 = new aws.S3();
    
    if(process.env.NODE_ENV !== 'test'){
        aws.config.update({ region: config.region });
    }
    return { awsS3, config };
}

function getMIME(filepath) {
    if (!/\.(\w+)$/.test(filepath)) {
        return null;
    }
    const ext = /\.(\w+)$/.exec(filepath)[1].toLowerCase();
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


/** @typedef {{
 *  bucket: string,
 *  region: string,
 * }} S3Config
 */
