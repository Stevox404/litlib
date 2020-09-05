const { exec } = require('child_process');
const { promisify } = require('util');
const { expect } = require('chai');
const { Db } = require('../ldb');
const execAsync = promisify(exec);

describe('ldb', () => {
    before(async () => {
        await execAsync(`psql -c "DROP DATABASE IF EXISTS _ldb_test_db"`);
        await execAsync(`psql -c "DROP DATABASE IF EXISTS _ldb_test_db_test"`);
        await execAsync(`psql -c "DROP USER IF EXISTS _ldb_test_user"`);
        await execAsync(`psql -c "DROP USER IF EXISTS _ldb_test_user2"`);
        await execAsync(`psql -c "CREATE USER _ldb_test_user WITH PASSWORD '123'"`);
        await execAsync(`psql -c "CREATE USER _ldb_test_user2 WITH PASSWORD '123'"`);
        await execAsync(`psql -c "CREATE DATABASE _ldb_test_db"`);
        await execAsync(`psql -c "CREATE DATABASE _ldb_test_db_test"`);
        Db.init({
            user: '_ldb_test_user',
            password: '123',
            database: '_ldb_test_db'
        });
    });


    it('Should initialize db', async () => {
        let error;
        
        // Init error
        try {
            Db.reset()
            new Db();
        } catch (err) {
            error = err
        }
        expect(error.message).to.equal('Database not initialized');
        error = undefined;
        
        
        // Config error
        const url = process.env.DATABASE_URL;
        try {
            process.env.DATABASE_URL = '';
            Db.init({
                user: '_ldb_test_user2',
            });
        } catch (err) {
            error = err
        }
        expect(error.message).to.equal('Database improperly configured');
        process.env.DATABASE_URL = url;
        error = undefined;


        // Successful init        
        Db.init({
            user: '_ldb_test_user2',
            password: '123',
            database: '_ldb_test_db'
        });
    });

    it('Should initialize db object using passed param', async () => {
        new Db({
            user: '_ldb_test_user2',
            password: '123',
            database: '_ldb_test_db',
        });
    });

    it('Should execute a query', async () => {
        const db = new Db();
        const r = await db.execute('SELECT (1+1) AS sum');
        expect(r.rows[0].sum).to.be.equal(2);
    });

    it('Should execute a transaction', async () => {
        const db = new Db();
        const [, , , , , r] = await db.execute([
            'CREATE TABLE users (name TEXT, _meta INT)',
            'INSERT INTO users (name) VALUES (\'baz\')',
            'INSERT INTO users (name, _meta) VALUES (\'foo\', 3) RETURNING *',
            'UPDATE users SET name=\'bar\' WHERE name = #name#',
            db.createUpdateStatement('users', {_meta: 36}, {_meta: 3, _op: '='}),
            'SELECT * FROM users WHERE name = \'bar\'',
        ]);
        expect(r.rows.length).to.be.equal(1);
        expect(r.rows[0].name).to.be.equal('bar');
        expect(r.rows[0]._meta).to.be.equal(36);
    });

    it('Should set null for transaction key lookups not found', async () => {
        const db = new Db();
        const [, , r] = await db.execute([
            'CREATE TABLE offices (name TEXT)',
            'INSERT INTO offices (name) VALUES (\'office1\') RETURNING *',
            'UPDATE offices SET name=\'wont_set\' WHERE name = #no_exist# RETURNING *',
        ]);
        expect(r.rows.length).to.be.equal(0);
    });

    it('Should report an aborted transaction', async () => {
        const db = new Db();
        try {
            await db.execute([
                'CREATE TABLE error_tbl (name TEXT)',
                'SELECT no_exist_function()',
            ]);
        } catch (err) {
            expect(err).to.be.an.instanceOf(Error);
        }
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
            { id: 54, _op: '=' }
        );
        expect(query).to.be.an('object').with.all.keys(['text', 'values']);
        expect(query.values).to.have.length(3);
        const expected = 'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3';
        const rgx = new RegExp(/(\s|\n)/gm);
        expect(query.text.replace(rgx, '')).to.equal(expected.replace(rgx, ''));
    });

    it('Should return null for create statements without values', async () => {
        const db = new Db();
        let query = db.createUpdateStatement('users');
        expect(query).to.be.null;
        query = db.createInsertStatement('users');
        expect(query).to.be.null;
    });

    it('Should ignore keys with undefined values in create statements', async () => {
        const db = new Db();
        const query = db.createUpdateStatement('users', {userId: 56, name: undefined});
        expect(query.values.length).to.be.equal(1);
    });

    it('Should create update statement with multiple conditions');

    after(async () => {
        const db = new Db();
        db.pool.end();
        await execAsync(`psql -c "DROP USER IF EXISTS pgdba_user"`);
        await execAsync(`psql -c "DROP DATABASE IF EXISTS pgdba_test"`);
    });
});