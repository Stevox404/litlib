const { Pool } = require('pg');
const url = require('url');
let includeResArray = false; // TODO


/**
 * @type {Pool} A pg Pool object
 */
let pool;

/** 
 * @param {import "pg".PoolConfig=} config 
 */
function init(config) {
    require('dotenv').config();

    let baseConfig = {
        max: 20,
        idleTimeoutMillis: 60000,
        port: 5432,
        host: 'localhost',
    };

    if (process.env.DATABASE_URL) {
        //Heroku
        const params = url.parse(process.env.DATABASE_URL);
        const auth = params.auth.split(':');

        baseConfig = {
            user: auth[0],
            password: auth[1],
            host: params.hostname,
            port: params.port,
            database: params.pathname.split('/')[1],
            ssl: { rejectUnauthorized: false }
        };
    } else {
        baseConfig = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            max: process.env.MAX_POOL || 20,
            idleTimeoutMillis: process.env.IDLE_TIMEOUT_MS || 60000,
            port: process.env.DB_PORT || 5432,
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_DATABASE,
            ssl: { rejectUnauthorized: false }
        }

        if (process.env.NODE_ENV === 'test' && process.env.DB_DATABASE_TEST) {
            baseConfig.database = process.env.DB_DATABASE_TEST;
        }
    }

    config = { ...baseConfig, ...(config || {}) };

    validateConfig(config);

    pool = new Pool(config);
    return;



    function validateConfig(config) {
        if (!(config.user && config.password && config.database)) {
            throw new Error(`Please pass a proper config file or set up the .env file with proper keys`);
        }
    }
}




/**
 * Handles a database query.
  * @param {QueryStatement|QueryStatement[]} statement - Query to be executed.
 *   If an array, performs a transaction.
 * @param {QueryCallback=} cb - Called after completion (or failure) of db operation. Optionally ommited to return a Promise.
 */
function query(statement, cb) {
    if (!pool) init();
    if (Array.isArray(statement)) {
        return db_transaction(statement, cb);
    }
    return db_query(statement);
}



/**
 * Handles a single database query.
 * @param {QueryStatement} statement - Query to be executed.
 * @param {QueryCallback=} cb - Called after completion (or failure) of db operation.
 *   Optionally ommited to return a Promise.
 * @private
 */
function db_query(statement, cb) {
    return pool.query(statement, cb);
}


/**
 * Handles a single database transaction query.
 * @param {import('pg').QueryConfig} statement - Query to be executed.
 * @param {import('pg').PoolClient} client - Client executing the transaction.
 * @param {QueryCallback} cb - Called after completion (or failure) of db operation.
 *   Optionally omitted to return a Promise
 * @private
 */
function _db_transaction_query(statement, client) {
    return client.query(statement);
}


/**
 * Handles a database transaction
 * @param {QueryStatement[]} statements - List of queries to be executed.
 * @param {QueryCallback=} cb - Called after completion (or failure) of db operation.
 *   Optionally omitted to return a Promise.
 */
function db_transaction(statements, cb) {
    if (!cb) {
        return Promise.resolve().then(() => new Promise((resolve, reject) => {
            db_transaction(statements, (err, results) => {
                err ? reject(err) : resolve(results)
            });
        }));
    }

    pool.connect((err, client, done) => {
        if (err) {
            console.warn("Error in database connection!");
            cb(err);
            done(err);
            throw err;
        }

        let results = [];

        client.query('BEGIN', async (err) => {
            if (err) {
                console.warn('Problem starting transaction', err);
                cb(err);
                return done(err);
            }

            try {
                for (let i = 0, l = statements.length; i < l; i++) {
                    const statement = statements[i]
                    const nextQuery = statements[i + 1]

                    const res = await _db_transaction_query(statement, client);
                    results.push(res);

                    // Use prev results to remove placeholders in the next query
                    if (nextQuery) {
                        if (nextQuery.text) {
                            nextQuery.text = formatStatement(nextQuery.text);
                        } else {
                            statements[i + 1] = formatStatement(nextQuery);
                        }
                    }
                };
            } catch (exception) {
                console.warn('Unable to complete transaction, rolling back.');
                return client.query('ROLLBACK', function (err) {
                    if (err) {
                        console.warn('Unable to rollback transaction, killing client', err);
                        cb(err);
                        return done(err);
                    }
                    console.info('Successfully rolledback transaction');
                    cb(exception);
                    done(exception);
                });
            }

            client.query('COMMIT', err => {
                if (err) {
                    console.warn('Unable to commit transaction, killing client', err);
                    cb(err);
                    return done(err);
                }
                cb(err, results);
                done(err);
            });


			/**
			 * Queries that depend on a value from the previous query will use the placeholder '#key#'
			 * Where 'key' is the column name of the required value eg. #user_id#.
			 * 
             * Query example: UPDATE books SET title='New Title' WHERE author_id = #author_id#
			 * 
             * @param {string} statement - Query with placeholders
			 */
            function formatStatement(statement) {
                let formatted = statement.replace(/(?:[#])(\w+)(?:[#])/g, (_match, key) => {
                    return deepSearch(key.toLowerCase());
                });
                return formatted;
            }

            function deepSearch(key) {
                for (let l = results.length, i = l - 1; i > -1; i--) {
                    const { rows } = results[i];
                    for (let row of rows) {
                        if (row && row[key]) {
                            return row[key]
                        }
                    }
                }

                return null;
            }

        });
    });
}



/**
 * Initialize PG object.
 * Optional config object may be passed, 
 * otherwise uses already initialized PG object.
 * If none already exists, it is initalized using env variables 
 * (See env.sample)
 * @param {import "pg".PoolConfig=} config 
 */
function getDb(config) {
    if (config || !pool) {
        /* TODO Manage multiple dbs */
        init(config);
    }

    return {
        query, pool,
        ...(require('./db_utils')),
    }
}


module.exports = getDb;

/**
 * @typedef {import('pg').QueryConfig} QueryStatement 
 */
/**
 * @callback QueryCallback
 * @param {Error} err
 * @param {import('pg').QueryArrayResult} result
 */
