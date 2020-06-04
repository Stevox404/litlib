const nodemailer = require('nodemailer');

let emailConfig, transporter;
function setConfiguration(config) {
    if(!config){
        require('dotenv').config();

        config = {
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
    }

    if(!config.transportOpts.tls) {
        config.transportOpts.tls = {
            rejectUnauthorized: false
        }
    }
    
    validateConfig(config);
    emailConfig = config;

    function validateConfig({ transportOpts }) {
        const {host, port, auth, service } = transportOpts;

        if((!service && (!host || !port)) || !auth.user || !auth.pass ){
            throw new Error('mailer.email configuration invalid');
        }
        transporter = nodemailer.createTransport(transportOpts);
    }
}

function send({ from, to, message, ...otherArgs }) {
    return new Promise((resolve, reject) => {
        const { username, email, footer } = emailConfig

        from = from || `"${username}" ${email}`;
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


function init(config){
    if (config || !transporter) setConfiguration(config);
    return {
        send,
    }
}

module.exports = init;