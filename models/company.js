"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies. Extracts values from object filter if provided; if not,
   * default to empty object.
   * Return error if minEmployees > maxEmployees.
   * Perform filter method to create query string and extract values for each
   * query parameter.
   * Search database based on query.
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filter = {}) {
    const {minEmployees, maxEmployees} = filter;

    if (minEmployees > maxEmployees){
      throw new BadRequestError(`Min cannot be greater than max!`);
    }

    const sqlFiltered =  Company._filter(filter);

    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${sqlFiltered.strTotal}
        ORDER BY name`, sqlFiltered.valuesFiltered);

    return companiesRes.rows;
  }

 /** Receives object. Extracts values from object, pushes into valuesFiltered.
  * Creates string for each value, pushes into colsFiltered.
  * Joins elements in colsFiltered to create string setCols.
  * Creates query string strTotal by concatenating 'WHERE' with setCols.
  * Returns object with strTotal and colsFiltered.
  */
  static _filter(filter) {
    const {nameLike, minEmployees, maxEmployees} = filter;

    let colsFiltered = [];
    let valuesFiltered = [];

    if (nameLike){
      valuesFiltered.push(nameLike);
      colsFiltered.push(`"name" ILIKE '%' || $${valuesFiltered.length} || '%'`);
    }
    if (minEmployees){
      valuesFiltered.push(minEmployees);
      colsFiltered.push(`"num_employees">=$${valuesFiltered.length}`);
    }
    if (maxEmployees){
      valuesFiltered.push(maxEmployees);
      colsFiltered.push(`"num_employees"<=$${valuesFiltered.length}`);
    }

    let strTotal ='';

    if (colsFiltered.length !== 0){
    let setCols = colsFiltered.join(" AND ");
     strTotal += `WHERE ` + setCols
    }

    return {strTotal, valuesFiltered}
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const companyJobs = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        WHERE company_handle = $1`, [handle]);

    const company = companyRes.rows[0];
    const jobs = companyJobs.rows;

    if (!company) throw new NotFoundError(`No company: ${handle}`);
    if (jobs.length !== 0) {
      company.jobs = jobs;
    }
    return company;
  }


  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
