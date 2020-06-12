const nodemailer = require('nodemailer');

let emailConfig;
/** @type {import('nodemailer').Transporter} */
let transporter;

/**
 * @param {ConfigObject} config 
 */
function setConfiguration(config) {
    require('dotenv').config();

    const baseConfig = {
        username: process.env.EMAIL_NAME,
        email: process.env.EMAIL_ADDRESS,
        footer: '',
        transportOpts: {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        },
    }

    config = { ...baseConfig, ...(config || {}) };

    if (!config.transportOpts.tls) {
        config.transportOpts.tls = {
            rejectUnauthorized: false
        }
    }

    validateConfig(config);
    emailConfig = config;

    function validateConfig({ transportOpts }) {
        const { host, port, auth, service } = transportOpts;

        if ((!service && (!host || !port)) || !auth.user || !auth.pass) {
            throw new Error('mailer.email configuration invalid');
        }
        transporter = nodemailer.createTransport(transportOpts);
    }
}


/**
 * Send email message
 * @param {import('nodemailer/lib/mailer').Options} opts 
 */
function send({ from, to, message, ...otherArgs }) {
    return new Promise((resolve, reject) => {
        const { username, email, footer } = emailConfig

        const uName = username ? `"${username}" ` : '';
        from = from || `${uName}${email}`;
        footer && (message += footer);

        let mailOptions = {
            from,
            to,
            html: message,
            ...otherArgs
        }

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                err.to = to;
                reject(err);
            } else {
                resolve(info);
            }

        });
    });
}



/**
 * Initialize Email object.
 * Optional config object may be passed, 
 * otherwise uses already initialized Email object.
 * If none already exists, it is initalized using env variables 
 * (See env.sample)
 * @param {ConfigObject=} config 
 */
function init(config) {
    if (config || !transporter) setConfiguration(config);
    return {
        send,
    }
}

module.exports = init;



/**
 * @typedef ConfigObject
 * @property {string} username - defaults to env EMAIL_NAME
 * @property {string} email - defaults to env EMAIL_ADDRESS
 * @property {string} footer - HTML/Text to be appended to every email
 * @property {import('nodemailer/lib/smtp-transport')} transportOpts 
 */