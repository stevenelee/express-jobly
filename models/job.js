"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a Job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {


    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                  id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"`, [
          title,
          salary,
          equity,
          companyHandle
        ],
    );
    const job = result.rows[0];
    job.equity = Number(job.equity);
    console.log("job==========", job)

    return job;
  }

  /** Find all jobs. Extracts values from object filter if provided; if not,
   * default to empty object.
   * Perform filter method to create query string and extract values for each
   * query parameter.
   * Search database based on query.
   * Returns [{ title, salary, equity, companyHandle }, ...] or
   * return error if no results are found.
   * */

  static async findAll(filter = {}) {
    const sqlFiltered =  Job._filter(filter);

    const jobsRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        ${sqlFiltered.strTotal}
        ORDER BY company_handle`, sqlFiltered.valuesFiltered);

    if (jobsRes.rows.length === 0) throw new NotFoundError("No jobs matching criteria found.")

    return jobsRes.rows;
  }

 /** Receives object. Extracts values from object, pushes into valuesFiltered.
  * Creates string for each value, pushes into colsFiltered.
  * Joins elements in colsFiltered to create string setCols.
  * Creates query string strTotal by concatenating 'WHERE' with setCols.
  * Returns object with strTotal and colsFiltered.
  */
  static _filter(filter) {
    const {title, minSalary, hasEquity} = filter;

    let colsFiltered = [];
    let valuesFiltered = [];

    if (title){
      valuesFiltered.push(title);
      colsFiltered.push(`"title" ILIKE '%' || $${valuesFiltered.length} || '%'`);
    }
    if (minSalary){
      valuesFiltered.push(minSalary);
      colsFiltered.push(`"salary">=$${valuesFiltered.length}`);
    }
    if (hasEquity === true){
      valuesFiltered.push(0);
      colsFiltered.push(`"equity">$${valuesFiltered.length}`);
    }

    let strTotal ='';

    if (colsFiltered.length !== 0){
    let setCols = colsFiltered.join(" AND ");
     strTotal += `WHERE ` + setCols
    }

    return {strTotal, valuesFiltered}
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
                SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${handle}`);

    return job;
  }


  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle"
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${handle}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${handle}`);
  }
}


module.exports = Job;