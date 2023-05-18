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

/************************************** create */

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
  /************************************** findAll */

  describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([
        {
          title: "j1",
          salary: 1,
          equity: .1,
          company_handle: "c1",
        },
        {
          title: "j2",
          salary: 2,
          equity: .2,
          company_handle: "c2",
        },
        {
          title: "j3",
          salary: 3,
          equity: .3,
          company_handle: "c3",
        },
      ]);
    });

    test("works: with filter title", async function () {
      let job = await Job.findAll({title: "j3"});
      expect(job).toEqual([
        {
          title: "j3",
          salary: 3,
          equity: .3,
          company_handle: "c3",
        },
      ]);
    });

    test("works: with filter w/all criteria", async function () {
      let jobs = await Company.findAll({title: "j",
                                             minSalary: 2,
                                             hasEquity: true});
      expect(jobs).toEqual([
        {
          title: "j2",
          salary: 2,
          equity: .2,
          company_handle: "c2",
        },
        {
          title: "j3",
          salary: 3,
          equity: .3,
          company_handle: "c3",
        },
      ]);
    });

    test("throws error: filter w/all criteria but no matches", async function () {
      try {
        let jobs = await Company.findAll({title: "j",
                                             minSalary: 2,
                                             hasEquity: false});
        throw new Error("fail test, you shouldn't get here");
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });




  });
    /************************************** filter */


