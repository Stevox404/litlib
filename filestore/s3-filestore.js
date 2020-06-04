const aws = require('aws-sdk');
aws.config.region = 'us-east-1';
const s3 = new aws.S3();
const fsPromises = require('fs').promises;

let s3Config;



function init(config){
    if(!config){
        require('dotenv').config();
        config = {
            bucket: process.env.S3_BUCKET,
            region: process.env.S3_REGION || 'us-east-1',
        }
    }
    
    const { bucket, region } = config;
    
    if(!bucket){
        throw new Error('Please set the S3_BUCKET env variable');
    }

    aws.config.region = region;
    s3Config = config;
    s3Config.url = `https://${bucket}.s3.amazonaws.com`;


}

const getFile = (filepath) => {
    if(!filepath) return null;
    
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


const saveFile = (filepath, file) => {
    if(!filepath || !file) return null;
    
    return Promise.resolve().then(() =>
        new Promise(async (resolve, reject) => {
            const data = file.path ? await fsPromises.readFile(file.path) : file;

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
                    err = new Error('Error in saving file: ' + filepath + ' in bucket. Error: ' + err);
                    return reject(err);
                }
                resolve(`${s3Config.url}/${filepath}`)
            });

        })
    );
};

const deleteFile = (filepath) => {
    if(!filepath) return null;
    
    return Promise.resolve().then(() =>
        new Promise((resolve, reject) => {
            // Check if fully qualified filepath
            const regex = RegExp(`${s3Config.url}/(.+)`);
            const m = filepath.match(regex);
            if (m && m[1]) {
                filepath = m[1];
            }

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


module.exports = (config) => {
    if(config || !s3Config) init(config);
    
    return {
        getFile, saveFile, deleteFile, 
        url: s3Config.url, path: s3Config.url,
    }
}