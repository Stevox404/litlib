const nodemailer = require('nodemailer');
const { promisify } = require('util');

let config, transporter;
async function init(conf) {
    conf = {
        username: process.env.EMAIL_NAME,
        email: process.env.EMAIL_ADDRESS,
        footer: '',
        transportOpts: {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        },
        ...conf
    }

    await validateConfig(conf);
    config = conf;

    async function validateConfig({ transportOpts }) {
        transporter = nodemailer.createTransport(transportOpts);
        const verify = promisify(transporter.verify);
        await verify();
    }
}

function send({ from, to, message, ...otherArgs }) {
    if (!transporter) throw new Error('Email configuration unset');

    return new Promise((resolve, reject) => {
        const { username, email, footer } = config

        from = from || `"${username}"${email}`;
        footer && (message += footer);

        let mailOptions = {
            from,
            to,
            html: message,
            ...otherArgs
        }

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                reject((`Mail sending to ${recipient} failed due to Error`, err));
                console.err("Sent Fail.", err);
            } else {
                console.log("Sent")
                resolve("Message sent: %s", info.response);
            }

        });
    });
}


module.exports = {
    init, send
};