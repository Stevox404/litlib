const nodemailer = require('nodemailer');

function sendEmail({ req, recipient, message, subject, args }) {
    return new Promise((resolve, reject) => {
        let homepage = req.hostname;

        //TODO Add disclaimer or something
        message += '<br/><br/><a href="' + homepage + '">www.mywebsite.com</a> <br/>' +
            'MY WEBSITE<br/>';


        let config = {
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            },
        }
        const service = process.env.EMAIL_SERVICE;
        if (service){
            config = {...config, service}
        } else {
            config = {
                ...config,
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
            }
        }
        let transporter = nodemailer.createTransport(config);


        let mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: recipient,
            subject,
            html: message
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
    })
}


module.exports = sendEmail;