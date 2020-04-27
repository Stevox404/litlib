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
		return '';
	}
}

function createInsertStatement(table, fields){
	//TODO
	let query = {
		text: `INSERT INTO ${table} (`,
		values: []
	}
	
	let valStmt = '';
	Object.keys(fields).forEach(key => {
		const col = camelToSnakeCase(key);
		query.values.push(fields[key]);
		const commma = addComma(query.values.length);
		query.text += `${commma} ${col}`;
		valStmt += `${commma} $${query.values.length}`;
	});

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

/**
 * Update statement object
 * @typedef {Object} updateStmtObject
 * @property {string} table - Table to be updated
 * @property {object} fields - An object of column_name:value pairs for the query
 * @property {object} condition - column_name:value pair for update condition.
 *   Only single condition currently supported. Add other conditions manually.
 */