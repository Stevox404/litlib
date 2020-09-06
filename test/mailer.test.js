const { Email } = require('../mailer');
const { expect } = require('chai');

describe.only('Mailer', function () {
    this.timeout(5000);

    it('Should initialize Email using .env params', async () => {
        Email.reset();
        process.env.EMAIL_NAME='name'
        await Email.init();
        const email = new Email();
        expect(email.getConfig().username).to.be.equal('name');
    });

    it('Should initialize Email using passed params', async () => {
        Email.reset();
        await Email.init({
            username: 'Foo',
        });
        const email = new Email();
        expect(email.getConfig().username).to.be.equal('Foo');
    });

    it('Should send an email', async () => {
        await Email.init();
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