const mongoose = require("mongoose");

const ClubSchema = new mongoose.Schema({
  clubName: {
    type: String,
    // required: true,
  },

  username: {
    type: String,
    // required: true,
    // unique: true,
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

  address: {
    type: String,
    // required: true,
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

module.exports = mongoose.model("Club", ClubSchema);
