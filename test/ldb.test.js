const { exec } = require('child_process');
const { promisify } = require('util');
const { expect } = require('chai');
const { Db } = require('../ldb');
const execAsync = promisify(exec);

describe('ldb', () => {
    before(async () => {
        await execAsync(`psql -c "DROP USER IF EXISTS _ldb_test_user"`);
        await execAsync(`psql -c "DROP DATABASE IF EXISTS _ldb_test_db"`);
        await execAsync(`psql -c "CREATE USER _ldb_test_user WITH PASSWORD '123'"`);
        await execAsync(`psql -c "CREATE DATABASE _ldb_test_db"`);
        Db.init({
            user: '_ldb_test_user',
            password: '123',
            database: '_ldb_test_db'
        });
    });

    it('Should connect to the database', async () => {
        const db = new Db();
        const r = await db.execute('SELECT (1+1) AS sum');
        expect(r.rows[0].sum).to.be.equal(2);
    });

    it('Should create an Insert statement', async () => {
        const db = new Db();
        const query = db.createInsertStatement(
            'users',
            { firstName: 'lit', lastName: 'lib' }
        );
        expect(query).to.be.an('object').with.all.keys(['text', 'values']);
        expect(query.values).to.have.length(2);
        const expected = 'INSERT INTO users (first_name, last_name) VALUES ($1, $2)'
        const rgx = new RegExp(/(\s|\n)/gm);
        expect(query.text.replace(rgx, '')).to.equal(expected.replace(rgx, ''));
    });

    it('Should create an Update statement', async () => {
        const db = new Db();
        const query = db.createUpdateStatement(
            'users',
            { firstName: 'lit', lastName: 'lib' },
            { id: 54 }
        );
        expect(query).to.be.an('object').with.all.keys(['text', 'values']);
        expect(query.values).to.have.length(3);
        const expected = 'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3';
        const rgx = new RegExp(/(\s|\n)/gm);
        expect(query.text.replace(rgx, '')).to.equal(expected.replace(rgx, ''));
    });

    after(async () => {
        const db = new Db();
        db.pool.end();
        await execAsync(`psql -c "DROP USER IF EXISTS pgdba_user"`);
        await execAsync(`psql -c "DROP DATABASE IF EXISTS pgdba_test"`);
    });
});