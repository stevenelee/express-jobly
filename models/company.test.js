"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
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

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let companies = await Company.findAll();
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  test("works: with filter", async function () {
    let companies = await Company.findAll({minEmployees: 2});
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  test("works: with filter w/all criteria", async function () {
    let companies = await Company.findAll({nameLike: "c",
                                           minEmployees: 3,
                                           maxEmployees: 5});
    expect(companies).toEqual([
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  test("throw error when minEmployees > maxEmployees", async function () {
    try {
      await Company.findAll({nameLike: "c",
                            minEmployees: 3,
                            maxEmployees: 2
     });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});


/************************************** filter */

describe("filter", function () {
  test("filter works with nameLike", function () {
    let results = Company._filter({nameLike: "c"});
    expect(results).toEqual(
      {
        strTotal: `WHERE "name" ILIKE '%' || $1 || '%'`,
        valuesFiltered: ["c"]
      }
    );
  });

  test("filter works with minEmployees", function () {
    let results = Company._filter({minEmployees: 3});
    expect(results).toEqual(
      {
        strTotal: `WHERE "num_employees">=$1`,
        valuesFiltered: [3]
      }
    );
  });

  test("filter works with maxEmployees", function () {
    let results = Company._filter({maxEmployees: 1});
    expect(results).toEqual(
      {
        strTotal: `WHERE "num_employees"<=$1`,
        valuesFiltered: [1]
      }
    );
  });

  test("filter works with two criteria", function () {
    let results = Company._filter({minEmployees: 1, maxEmployees: 2});
    expect(results).toEqual(
      {
        strTotal: `WHERE "num_employees">=$1 AND "num_employees"<=$2`,
        valuesFiltered: [1, 2]
      }
    );
  });

  test("filter works with all criteria", function () {
    let results = Company._filter({nameLike: "c",
                                  minEmployees: 2,
                                  maxEmployees: 2});
    expect(results).toEqual(
      {
        strTotal: `WHERE "name" ILIKE '%' || $1 || '%' AND "num_employees">=$2 AND "num_employees"<=$3`,
        valuesFiltered: ["c", 2, 2]
      }
    );
  });

  test("returns object with no values for keys if no criteria", function () {
    let results = Company._filter({});
    expect(results).toEqual({strTotal: "", valuesFiltered: []});
  });

});

/************************************** get */

describe("get", function () {
  test("works with company with jobs", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
      jobs: [{
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0",
        companyHandle: "c1"
      }]
    });
  });

  test("works with company without jobs", async function () {
    let company = await Company.get("c2");
    expect(company).toEqual({
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img"
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
