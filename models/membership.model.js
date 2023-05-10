const mongoose = require("mongoose");

const MembershipSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  clubId: {
    type: String,
    required: true,
  },

  startDate: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Membership", MembershipSchema);
