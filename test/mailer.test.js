const { Email } = require('../mailer');
const { expect } = require('chai');

describe('Mailer', function () {
    this.timeout(5000);
    before(async () => {
        await Email.init();
    });

    it('Should send an email', async () => {
        const email = new Email();
        const info = await email.send({
            to: 'jason@milion.com',
            subject: 'BOY!',
            html: '<b>BOY!</b>'
        });
        expect(info).to.not.be.null;
        const url = email.getTestMessageUrl(info);
        console.log(url)
    });
});