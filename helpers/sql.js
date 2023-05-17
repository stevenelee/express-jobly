"use strict";

const { BadRequestError } = require("../expressError");

/** Perform a partial update of data
 *
 * Receives data to be updated in an object (dataToUpdate). Extracts keys from
 * object into an array called keys. Return error if no keys exist.
 *
 * Create array cols which consists of all keys converted into a string,
 * with a position for each key as reference to corresponding value
 * in sanitized array.
 *
 * Return object with key setCols whose value is cols converted into a string
 * with values separated by ", ", and key values whose value is an array of
 * all of the values from dataToUpdate.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
