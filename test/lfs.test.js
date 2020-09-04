process.env.NODE_ENV = 'test';
const { S3 } = require("../lfs");
const path = require('path');
const { expect } = require("chai");

describe('lfs', () => {
    it('Saves file', async () => {
        S3.init();
        const s3 = new S3();
        await s3.saveFile('/test.txt', {path: path.resolve(__dirname, 'sample-file.txt')});
        const data = await s3.getFile('/test.txt');
        expect(data.Body).to.not.be.null;
        await s3.deleteFile('/test.txt');
        try {
            await s3.getFile('/test.txt');
        } catch(err) {
            expect(err.code).to.equal('NoSuchKey');
        }
    });
})