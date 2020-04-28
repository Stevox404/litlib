const { email } = require('../mailer');
const { send } = email();

describe.skip('Mailer', () => {
    it('Should send an email', async () => {
        send({
            to: 'foobar@email.com',
            message: 'Some message here'
        });
    });
});