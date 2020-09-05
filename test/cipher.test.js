const { expect } = require("chai");
const { encrypt, generateKey, decrypt, generateSalt, hashText } = require("../cipher");


describe('Cipher', () => {
    it('Should encrypt and decrypt data', async () => {
        const data = 'Sample String';
        const salt = generateSalt()
        const key = await generateKey('password', salt);
        const encrypted = await encrypt(data, key);
        const decrypted = await decrypt(encrypted, key);
        
        expect(encrypted).is.not.equal(data);
        expect(decrypted).is.equal(data);
    });

    it('Should hash data', () => {
        const data = 'Sample String';
        const hash = hashText(data);
        expect(hash).is.not.equal(data);
    });
})