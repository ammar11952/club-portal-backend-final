const { text } = require("express");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    // required: true,
  },

  lastName: {
    type: String,
    // required: true,
  },

  username: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  gender: {
    type: String,
  },

  picture: {
    type: String,
  },

  awsKey: {
    type: String,
  },

  description: {
    type: String,
  },
});

module.exports = mongoose.model("User", UserSchema);
