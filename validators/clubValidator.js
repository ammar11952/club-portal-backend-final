const { check } = require("express-validator");

function clubValidator(route) {
  switch (route) {
    case "/login":
      return [
        check("username", "Username must be a string").isString(),
        check(
          "password",
          "Password must contain at least 4 characters"
        ).isLength({ min: 4 }),
      ];

    case "/":
      return [
        check(
          "id",
          "id must be a hexadecimal string of 24 characters"
        ).isLength({ min: 24, max: 24 }),
      ];

    case "/create":
      return [
        check("clubName", "clubName must be a string").isString(),
        // check('username', 'Username must be a string').isString(),
        check(
          "password",
          "Password must contain at least 4 characters"
        ).isLength({ min: 4 }),
        check("email", "email should be a valid email address").isEmail(),
        check("address", "address should be a string").isString(),
      ];

    case "/edit":
      return [
        check("clubName", "clubName must be a string").isString(),
        check("username", "Username must be a string").isString(),
        check(
          "password",
          "Password must contain at least 4 characters"
        ).isLength({ min: 4 }),
        check("email", "email should be a valid email address").isEmail(),
        check("address", "address should be a string").isString(),
      ];

    case "/delete":
      return [
        check(
          "id",
          "id must be a hexadecimal string of 24 characters"
        ).isLength({ min: 24, max: 24 }),
      ];
  }
}

module.exports = clubValidator;
