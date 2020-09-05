const { 
    snakeToCamelCase, camelToSnakeCase, manageLogs, ServerError
} = require('../utils');
const expect = require('chai').expect;

describe('utils', () => {
    it('Should convert snake_case to camelCase', () => {
        const str = 'test_string';
        expect(snakeToCamelCase(str)).to.be.equal('testString');
        const obj = {foo_bar:'foo_bar'};
        expect(snakeToCamelCase(obj)).to.eql({fooBar:'foo_bar'});
        const arr = ['foo_bar', [obj]];
        expect(snakeToCamelCase(arr)).to.eql(['foo_bar', [{fooBar:'foo_bar'}]]);
    });
    
    it('Should convert camelCase to snake_case', () => {
        const str = 'testString';
        expect(camelToSnakeCase(str)).to.eql('test_string');
        const obj = {fooBar:'fooBar'};
        expect(camelToSnakeCase(obj)).to.eql({foo_bar:'fooBar'});
        const arr = ['fooBar', [obj]];
        expect(camelToSnakeCase(arr)).to.eql(['fooBar', [{foo_bar:'fooBar'}]]);
    });
    
    it('Should manage logs', () => {
        const logFn = console.log;
        expect(console.log).to.be.equal(logFn);
        manageLogs();
        expect(console.log).to.not.equal(logFn);
    })
    
    it('Should create a proper ServerError object', () => {
        const nativeErr = new Error('Sample Error');
        let err = new ServerError('Error message', {status: 400, text: 'Status text', err: nativeErr});
        expect(err.name).to.be.equal('ServerError');
        expect(err.message).to.be.equal(nativeErr.message);
        expect(err.status).to.be.equal(400);
        expect(err.text).to.be.equal('Status text');
        expect(err.stack).to.be.equal(nativeErr.stack);
        err = new ServerError('Error message');
        expect(err.message).to.be.equal('Error message');
        expect(err.status).to.be.equal(500);
        expect(err.text).to.not.be.undefined;
        err = new ServerError(nativeErr);
        expect(err.message).to.be.equal(nativeErr.message);
        expect(err.status).to.be.equal(500);
        expect(err.text).to.not.be.undefined;
        expect(err.stack).to.be.equal(nativeErr.stack);
        err = new ServerError({status: 400, text: 'Status text'});
        expect(err.message).to.be.equal(err.text);
        expect(err.status).to.be.equal(400);
        expect(err.text).to.be.equal('Status text');
        err = new ServerError('Error message', {status: 400, err: nativeErr});
        expect(err.message).to.be.equal(nativeErr.message);
        expect(err.status).to.be.equal(400);
        expect(err.text).to.not.be.undefined;
        expect(err.stack).to.be.equal(nativeErr.stack);
        err = new ServerError(400);
        expect(err.message).to.be.equal(err.text);
        expect(err.status).to.be.equal(400);
        expect(err.text).to.not.be.undefined;
        err = new ServerError(400, 'Error Text');
        expect(err.message).to.be.equal(err.text);
        expect(err.status).to.be.equal(400);
        expect(err.text).to.be.equal('Error Text');
        err = new ServerError(400, nativeErr);
        expect(err.message).to.be.equal(nativeErr.message);
        expect(err.status).to.be.equal(400);
    });
});