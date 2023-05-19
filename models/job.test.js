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
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE title = 'new'`);

    result.rows[0].equity = Number(result.rows[0].equity);
    expect(job).toEqual(result.rows[0]);
    expect(result.rows[0]).toEqual(
      {
        id: expect.any(Number),
        title: "new",
        salary: 420,
        equity: 0.69,
        companyHandle: "c1"
      }
    );
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
        equity: 0,
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

  test("works: with filter w/all criteria but equity is true", async function () {
    let jobs = await Job.findAll({title: "j",
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

  test("works: with filter w/all criteria but equity is false", async function () {
    let jobs = await Job.findAll({title: "j",
                                            minSalary: 2,
                                            hasEquity: false});
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
                                            minSalary: 4,
                                            hasEquity: false});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});
    /************************************** filter */

describe("filter", function () {
  test("filter works with title", function () {
    let results = Job._filter({title: "j"});
    expect(results).toEqual(
      {
        strTotal: `WHERE "title" ILIKE '%' || $1 || '%'`,
        valuesFiltered: ["j"]
      }
    );
  });

  test("filter works with minSalary", function () {
    let results = Job._filter({minSalary: 3});
    expect(results).toEqual(
      {
        strTotal: `WHERE "salary">=$1`,
        valuesFiltered: [3]
      }
    );
  });

  test("filter works with hasEquity true", function () {
    let results = Job._filter({hasEquity: true});
    expect(results).toEqual(
      {
        strTotal: `WHERE "equity">$1`,
        valuesFiltered: [0]
      }
    );
  });

  test("filter works with hasEquity false", function () {
    let results = Job._filter({hasEquity: false});
    expect(results).toEqual(
      {
        strTotal: ``,
        valuesFiltered: []
      }
    );
  });

  test("filter works with all criteria w/ equity as true", function () {
    let results = Job._filter({title: "j",
                                  minSalary: 1,
                                  hasEquity: true});
    expect(results).toEqual(
      {
        strTotal: `WHERE "title" ILIKE '%' || $1 || '%' AND "salary">=$2 AND "equity">$3`,
        valuesFiltered: ["j", 1, 0]
      }
    );
  });

  test("filter works with all criteria w/ equity as false", function () {
    let results = Job._filter({title: "j",
                                  minSalary: 1,
                                  hasEquity: false});
    expect(results).toEqual(
      {
        strTotal: `WHERE "title" ILIKE '%' || $1 || '%' AND "salary">=$2`,
        valuesFiltered: ["j", 1]
      }
    );
  });

  test("returns object with no values for keys if no criteria", function () {
    let results = Job._filter({});
    expect(results).toEqual({strTotal: "", valuesFiltered: []});
  });

});

