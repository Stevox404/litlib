const { 
    snakeToCamelCase, camelToSnakeCase, manageLogs, ServerError
} = require('../utils');
const expect = require('chai').expect;

describe('utils', () => {
    it('Should convert snake_case to camelCase', () => {
        const str = 'test_string';
        expect(snakeToCamelCase(str)).to.be.equal('testString');
    });
    
    it('Should convert camelCase to snake_case', () => {
        const str = 'testString';
        expect(camelToSnakeCase(str)).to.be.equal('test_string');
    });
    
    it('Should manage logs', () => {
        const logFn = console.log;
        expect(console.log).to.be.equal(logFn);
        manageLogs();
        expect(console.log).to.not.equal(logFn);
    })
    
    it('Should create a proper ServerError object', () => {
        let err = new ServerError('Error message', {status: 500, text: 'Status text'});
        expect(err.name).to.be.equal('ServerError');
        expect(err.message).to.be.equal('Error message');
        expect(err.status).to.be.equal(500);
        expect(err.text).to.be.equal('Status text');
        err = new ServerError({status: 500, text: 'Status text'});
        expect(err.message).to.be.equal(err.text);
        expect(err.status).to.be.equal(500);
        expect(err.text).to.be.equal('Status text');
        err = new ServerError('Error message', {status: 500});
        expect(err.message).to.be.equal('Error message');
        expect(err.status).to.be.equal(500);
        expect(err.text).to.not.be.undefined;
        err = new ServerError(500);
        expect(err.message).to.be.equal(err.text);
        expect(err.status).to.be.equal(500);
        expect(err.text).to.not.be.undefined;
        err = new ServerError(500, 'Error Text');
        expect(err.message).to.be.equal(err.text);
        expect(err.status).to.be.equal(500);
        expect(err.text).to.be.equal('Error Text');
    });
});