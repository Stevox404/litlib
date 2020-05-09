const {camelToSnakeCase} = require('../utils');
const addComma = (len) => len > 1 ? ', ' : '';

/**
 * @param {string} table - Table to be updated
 * @param {object} fields - An object of column_name:value pairs for the query
 * @param {object} condition - column_name:value pair for update condition.
 *   Only single condition currently supported. Add other conditions manually.
 * @returns {import('./index').statementObject} query
 */
function createUpdateStatement(table, fields, condition){
	let query = {
		text: `UPDATE ${table} SET`,
		values: []
    }
    
    for(let [key, val] of Object.entries(fields)){
        if(val === undefined) continue;

        const col = camelToSnakeCase(key);
        query.values.push(val);
        query.text += `${addComma(query.values.length)} ${col} = $${query.values.length}`;
    }
		
	if (query.values.length > 0) {
		if(condition){
			const key = Object.keys(condition)[0];
			const col = camelToSnakeCase(key);
			query.values.push(condition[key]);
			query.text += ` WHERE ${col} = $${query.values.length}`;
		}

		return query;
	} else {
		//No changes to be made
		return '';
	}
}


/**
 * @type {function}
 * @param {string} table - Table to be updated
 * @param {object} fields - An object of column_name:value pairs for the query
 * @returns {import('./index').statementObject} query
 */
function createInsertStatement(table, fields){
	let query = {
		text: `INSERT INTO ${table} (`,
		values: []
	}
	
    let valStmt = '';
    for(let[key, val] of Object.entries(fields)){
        if(val === undefined) continue;

        const col = camelToSnakeCase(key);
        query.values.push(val);
        const commma = addComma(query.values.length);
        query.text += `${commma} ${col}`;
        valStmt += `${commma} $${query.values.length}`;
    }

	query.text += `) VALUES (${valStmt})`;
	
	if (query.values.length > 0) {
		return query;
	} else {
		//No changes to be made
		return '';
	}
}



module.exports = {
	createUpdateStatement,
	createInsertStatement
};