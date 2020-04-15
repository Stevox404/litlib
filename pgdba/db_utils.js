const {camelToSnakeCase} = require('../utils');
const addComma = (len) => len > 1 ? ', ' : '';

/**
 * @param {updateStmtObject} {table, fields, condition}
 * @returns {string} query
 */
function createUpdateStatement(table, fields, condition){
	let query = {
		text: `UPDATE ${table} SET`,
		values: []
	}
	
	Object.keys(fields).forEach(key => {
		const col = camelToSnakeCase(key);
		query.values.push(fields[key]);
		query.text += `${addComma(query.values.length)} ${col} = $${query.values.length}`;		
	});
	
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
		return null;
	}
}

function createInsertStatement(){
	//TODO
}

module.exports = {
	createUpdateStatement
};

/**
 * Update statement object
 * @typedef {Object} updateStmtObject
 * @property {string} table - Table to be updated
 * @property {object} fields - An object of column_name:value pairs for the query
 * @property {object} condition - column_name:value pair for update condition.
 *   Only single condition currently supported. Add other conditions manually.
 */