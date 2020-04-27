const { exec } = require('child_process');
const { promisify } = require('util');
const { init, db } = require('../pgdba');
const { expect } = require('chai');
const execAsync = promisify(exec);

describe('pgdba', () => {

    before(async () => {
        await execAsync(`psql -c "DROP USER IF EXISTS pgdba_user"`);
        await execAsync(`psql -c "DROP DATABASE IF EXISTS pgdba_test"`);
        await execAsync(`psql -c "CREATE USER pgdba_user WITH PASSWORD '123'"`);
        await execAsync(`psql -c "CREATE DATABASE pgdba_test"`);
        init({
            user: 'pgdba_user',
            password: '123',
            database: 'pgdba_test'
        });
    });

    it('Should connect to the database', async () => {
        const { query } = db();
        const r = await query('SELECT (1+1) AS sum');
        expect(r.rows[0].sum).to.be.equal(2);
    });

    it('Should create an Insert statement', async () => {
        const { createInsertStatement } = db();
        const query = createInsertStatement(
            'users', 
            {firstName: 'lit', lastName:'lib'}
        );
        expect(query).to.be.an('object').with.all.keys(['text', 'values']);
        expect(query.values).to.have.length(2);
    });

    it('Should create an Update statement', async () => {
        const { createUpdateStatement } = db();
        const query = createUpdateStatement(
            'users', 
            {firstName: 'lit', lastName:'lib'}, 
            {id: 54}
        );
        expect(query).to.be.an('object').with.all.keys(['text', 'values']);
        expect(query.values).to.have.length(3);
    });

    after(async () => {
        const { pool } = db();
        pool.end();
        await execAsync(`psql -c "DROP USER IF EXISTS pgdba_user"`);
        await execAsync(`psql -c "DROP DATABASE IF EXISTS pgdba_test"`);
    });
});