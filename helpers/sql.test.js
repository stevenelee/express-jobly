"use strict";

const { sqlForPartialUpdate } = require("./sql.js");
const { BadRequestError } = require("../expressError");

describe("createToken", function () {

  test("works: sqlForPartialUpdate", function () {
    let data = {
      name: "Hufflepuff",
      description: "durr",
      numEmployees: 5,
      logoUrl: "heyo.com"
    }

    let result = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    })

    expect(result).toEqual({
        setCols:
            `"name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4`,
        values: ["Hufflepuff", "durr", 5, "heyo.com"]
    });

  });

});

// Data can include: {name, description, numEmployees, logoUrl}