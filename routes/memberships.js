const router = require("express").Router();

const verifyToken = require("../middlewares/verifyToken");
let Membership = require("../models/membership.model");
let { Club, User } = require("../models");

//Gets all the members of a club
router.get("/members/:id", verifyToken("both"), (req, res) => {
  Membership.find({ clubId: req.params.id })
    .then((memberships) => {
      if (memberships.length)
        res.json({ message: "Request successful!", data: memberships });
      else res.status(404).json("Error: No records found!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

router.get("/clubs/:id", async (req, res) => {
  try {
    const memberships = await Membership.find({ userId: req.params.id });
    if (memberships.length === 0) {
      return res.status(404).json({ message: "No records found!" });
    }

    const clubIds = memberships.map((membership) => membership.clubId);
    const clubs = await Club.find({ _id: { $in: clubIds } });

    return res
      .status(200)
      .json({ message: "Request successful!", data: clubs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:id", async (req, res) => {
  // console.log(req.params.id);
  try {
    const memberships = await Membership.find({ clubId: req.params.id });
    if (memberships.length === 0) {
      return res.status(404).json({ message: "No records found!" });
    }

    const membersIds = memberships.map((membership) => membership.userId);
    const users = await User.find({ _id: { $in: membersIds } });

    return res
      .status(200)
      .json({ message: "Request successful!", data: users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/checkmembership", (req, res) => {
  const myObj = req.query;

  Membership.find({ clubId: myObj.clubId, userId: myObj.userId })
    .then((memberships) => {
      res.status(200).json({ data: memberships });
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Starts a membership
router.post("/create", (req, res) => {
  const date = new Date();
  const today =
    date.getUTCDate() + "-" + date.getUTCMonth() + "-" + date.getUTCFullYear();

  req.body.startDate = today;
  req.body.isActive = true;

  console.log(req.body);
  const newMembership = new Membership(req.body);
  newMembership
    .save()
    .then((membership) =>
      res.json({
        message: "New Membership Created!",
        data: membership,
      })
    )
    .catch((error) => res.status(400).json("Error: " + error));
});

//Ends a membership
router.delete("/:id", (req, res) => {
  console.log(req.params.id);
  Membership.findOneAndDelete({ id: req.params.id })
    .then((membership) => {
      if (membership) res.json({ message: "Membership Deleted!}" });
      else res.status(404).json("Error: Membership NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

module.exports = router;
