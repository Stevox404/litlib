const { Pool } = require('pg');
const url = require('url');
let includeResArray = false; // TODO

require('dotenv').config();


let pool;
function init(config){
	if (config) {
		validateConfig(config);
	} else {
        if (process.env.DATABASE_URL) {
            //Heroku
            const params = url.parse(process.env.DATABASE_URL);
            const auth = params.auth.split(':');
        
            config = {
                user: auth[0],
                password: auth[1],
                host: params.hostname,
                port: params.port,
                database: params.pathname.split('/')[1],
                ssl: true
            };
        } else {
            config = {
                user: process.env.PGDB_USER,
                password: process.env.PGDB_PASSWORD,
                max: process.env.MAX_POOL || 20,
                idleTimeoutMillis: process.env.IDLE_TIMEOUT_MS || 60000,
                port: process.env.PGDB_PORT || 5432,
                host: process.env.PGDB_HOST || 'localhost',
                database: process.env.PGDB_DATABASE
            }
        
            if (process.env.NODE_ENV === 'test' && process.env.PGDB_DATABASE_TEST) {
                config.database = process.env.PGDB_DATABASE_TEST;
            }
        }
    
        validateConfig(config);
    }

    pool = new Pool(config);
	return;
	
	
	
	function validateConfig(config){
		if (!(config.user && config.password && config.port && config.database)) {
			throw new Error(`Please pass a proper config file or set up the .env file with the keys: 
				\tprocess.env.PGDB_USER={user} 
				\tprocess.env.PGDB_PASSWORD={password} 
				\tprocess.env.PGDB_PORT={port} 
				\tprocess.env.PGDB_DATABASE={database_name}`);
		}
	}
}





/**
 * Handles a database query.
 * @param {statement|statement[]} statement - Query to be executed.
 *   If an array, performs a transaction.
 * @param {requestCallback} cb - Called after completion (or failure) of db operation.
 *   Optionally ommited to return a Promise.
 */
function query(statement, cb){
	if(Array.isArray(statement)){
		return db_transaction(statement, cb);
	}
	return db_query(statement);
}




/**
 * Handles a single database query.
 * @param {statement} statement - Query to be executed.
 * @param {requestCallback} cb - Called after completion (or failure) of db operation.
 *   Optionally ommited to return a Promise.
 */

function db_query(statement, cb) {
    return pool.query(statement, cb);
}


/**
* [PRIVATE] Handles a single database transaction query.
* @param {statement} statement - Query to be executed.
* @param {object} client - Client executing the transaction.
* @param {requestCallback} cb - Called after completion (or failure) of db operation.
*   Optionally omitted to return a Promise
*/
function _db_transaction_query(statement, client) {
    return client.query(statement);
}


/**
 * Handles a database transaction
 * @param {statement[]} statements - List of queries to be executed.
 * @param {requestCallback} cb - Called after completion (or failure) of db operation.
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


function db(){
    if(!pool){
        throw new Error('Database is not initialized. Please call init() at least once.');
    }
    
    return {
        query, 
        ...(require('./db_utils')),
    }
}

module.exports = { init, db }







/**
 * Database Query Statement
 * @typedef {(string|statementObject)} statement
 */
/**
 * Database Query Statement object
 * @typedef {Object} statementObject
 * @property {string} text - A prepared statement query, args represented as ${num}
 * @property {any[]} values - Array of values for the query
 */
/**
 * Database operation callback
 * @callback requestCallback
 * @param {object} err
 * @param {object[]} results
 */