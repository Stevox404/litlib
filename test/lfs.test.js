const { S3 } = require("../lfs/s3");
const path = require('path');
const { expect } = require("chai");

describe('lfs', () => {
    it('Saves file', async () => {
        S3.init();
        const s3 = new S3();
        expect(s3.url).to.not.be.null;
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

    it('Should initialize a new S3 object', async () => {
        const s3 = new S3({bucket:'bkt', region:'us-east-2'});
        expect(s3.url).to.match(/bkt/);
    });

    it('Should throw initialization error if no bucket or region', async () => {
        let error;
        const bkt = process.env.S3_BUCKET;
        process.env.S3_BUCKET = '';
        try{
            new S3({});
        } catch (err){
            error = err;
        }
        expect(error.message).to.equal('Requires region and bucket for initialization');
        process.env.S3_BUCKET = bkt;
    });

    it('Should throw initialization error if no config', async () => {
        let error;
        try{
            S3.reset()
            new S3();
        } catch (err){
            error = err;
        }
        expect(error.message).to.equal('S3 not initialized');
    });
})