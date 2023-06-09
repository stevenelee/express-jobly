"use strict";

const { sqlForPartialUpdate } = require("./sql.js");
const { BadRequestError } = require("../expressError");

describe("partialUpdate", function () {

  test("works when all fields provided: sqlForPartialUpdate", function () {
    let data = {
      name: "Hufflepuff",
      description: "durr",
      numEmployees: 5,
      logoUrl: "heyo.com"
    };

    let result = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });

    expect(result).toEqual({
        setCols:
            `"name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4`,
        values: ["Hufflepuff", "durr", 5, "heyo.com"]
    });

  });

  test("works when not all fields provided: sqlForPartialUpdate", function () {
    let data = {
      name: "Hufflepuff",
      logoUrl: "heyo.com"
    };

    let result = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });

    expect(result).toEqual({
        setCols:
            `"name"=$1, "logo_url"=$2`,
        values: ["Hufflepuff", "heyo.com"]
    });

  });

  test("fails when no data is provided", function () {
    let data = {};

    expect(() => sqlForPartialUpdate(data, {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      }))
        .toThrow(BadRequestError);
  });
});