const { email } = require('../mailer');
const { init, send } = email;

describe.skip('Mailer', () => {
    before(async () => {
        await init();
    });

    it('Should send an email', async () => {
        send({
            to: 'foobar@email.com',
            message: 'Some message here'
        });
    });
});