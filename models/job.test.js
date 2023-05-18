"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe ("create", function () {
  const newJob = {
    title: "new",
    salary: 420,
    equity: 0.69,
    company_handle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
       FROM jobs
       WHERE title = 'new'`);

    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 420,
        equity: 0.69,
        company_handle: "c1"
      }
    ]);
  });

});