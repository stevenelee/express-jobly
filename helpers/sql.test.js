"use strict";

const { sqlForPartialUpdate } = require("./sql.js");
const { BadRequestError } = require("../expressError");

describe("partialUpdate", function () {

  test("works: sqlForPartialUpdate", function () {
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

  test("fails when no data is provided", function () {
    let data = {};

    expect(() => sqlForPartialUpdate(data, {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      }))
        .toThrow(BadRequestError);
  });
//TODO: add another test to make sure data can be updated with not all fields provided
});