const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const fs = require("fs");
const util = require("util");
const multer = require("multer");

dotenv.config();

const saltRounds = 10;
const upload = multer({ dest: "uploads/" });
const unlinkFile = util.promisify(fs.unlink);
const { uploadFile, getFileStream } = require("../utils/s3");
const sendMail = require("../utils/sendMail");
const { verifyToken } = require("../middlewares");
//const { clubValidator } = require('../validators');
let { Club, Token } = require("../models");

//Logins a club
router.post("/login", (req, res) => {
  console.log("in");
  console.log(req.body);
  const { email, password } = req.body;
  if (email && password) {
    console.log(email);
    Club.findOne({ email })
      .then((club) => {
        bcrypt
          .compare(password, club.password)
          .then((result) => {
            if (result == true) {
              console.log(club);
              // let token = jwt.sign(
              //   { email, issuer: "club" },
              //   process.env.SECRET,
              //   {
              //     expiresIn: "24h",
              //   }
              // );
              res.json({
                message: "Authentication Successful!",
                club,
              });
            } else {
              res.status(403).json({
                message: "Password Incorrect!",
              });
            }
          })
          .catch((error) => {
            res
              .status(400)
              .json("Could NOT decrypt passowrd! " + "Error: " + error);
          });
      })
      .catch((error) => {
        res.status(403).json("Username incorrect! " + "Error: " + error);
      });
  } else {
    res.status(400).json("Authentication failed! Problematic request.");
  }
});

// Changes a club's password
router.put("/changepassword", (req, res) => {
  console.log("req.body");
  console.log(req.body);
  const clubId = req.body.clubId;
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  Club.findById( clubId )
    .then((club) => {
      bcrypt
        .compare(currentPassword, club.password)
        .then((result) => {
          if (result == true) {
            bcrypt.hash(newPassword, saltRounds, (error, hash) => {
              if (error) {
                res.status(400).json("Could NOT hash password! " + error);
              } else {
                Club.findByIdAndUpdate(
                  clubId ,
                  { $set: { password: hash } },
                  { new: true }
                )
                  .then((club) => {
                    res.json("Password Updated Successfully!");
                  })
                  .catch((error) => {
                    res.status(400).json("Could NOT update password! " + error);
                  });
              }
            });
          } else {
            res.status(403).json({
              message: "Current Password Incorrect!",
            });
          }
        })
        .catch((error) => {
          res
            .status(400)
            .json("Could NOT decrypt current passowrd! " + "Error: " + error);
        });
    })
    .catch((error) => {
      res.status(403).json("Username incorrect! " + "Error: " + error);
    });
});

//Search for a club
router.get("/search/:keyword", (req, res) => {
  // console.log(req.params.keyword);
  Club.find({ clubName: { $regex: req.params.keyword, $options: "i" } })
    .then((clubs) => {
      if (clubs.length) res.json({ message: "Match found!", data: clubs });
      else res.json({ message: "No match found!", data: clubs });
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

router.get("/allclubs", async (req, res) => {
  try {
    const clubs = await Club.find();
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Gets club details
router.get("/:id", verifyToken("both"), (req, res) => {
  Club.findById(req.params.id)
    .then((club) => {
      if (club) res.json(club);
      else res.status(404).json("Error: Club NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Signs up a new club
router.post("/create", upload.single("image"), async (req, res) => {
  let clubKey = "",
    clubPicture = "";

  if (req.body.picture == "yes") {
    const result = await uploadFile(req.file);
    await unlinkFile(req.file.path);
    console.log(result);
    clubPicture = result.Location;
    clubKey = result.Key;
  }
  console.log(req.body);
  bcrypt
    .hash(req.body.password, saltRounds)
    .then((password) => {
      req.body.password = password;
      const newClub = new Club(req.body);
      console.log(newClub);
      if (!newClub.username) newClub.username = newClub.clubName;
      newClub.picture = clubPicture;
      newClub.awsKey = clubKey;

      console.log(newClub);
      newClub
        .save()
        .then((club) => res.json({ message: "New Club Created!", data: club }))
        .catch((error) => res.status(400).json("Error: " + error));
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Edits club details (Except username, email address and picture)
router.post("/edit/:id", verifyToken("club"), (req, res) => {
  Club.findOneAndUpdate({ clubId: req.params.id }, req.body)
    .then((club) => {
      if (club) res.json("Club Updated!");
      else res.status(404).json("Error: Club NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Edits club picture
router.put(
  "/edit-picture/:id",
  upload.single("image"),
  verifyToken("club"),
  async (req, res) => {
    const result = await uploadFile(req.file);
    await unlinkFile(req.file.path);
    console.log(result);

    Club.findOneAndUpdate(
      { _id: req.params.id },
      { picture: result.Location },
      { returnDocument: "after" }
    )
      .then((club) => {
        deleteFile(club.awsKey);
        res.json({
          message: "Club Picture Updated!",
          data: club,
        });
      })
      .catch((error) => res.status(400).json("Error: " + error));
  }
);

//Deletes club
router.delete("/delete/:id", (req, res) => {
  console.log( req.params.id);
  Club.findByIdAndDelete(req.params.id )
    .then((club) => {
      if (club) {
        res.json({
          message: "Club Deleted!",
        });
      } else res.status(404).json("Error: User NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Sends email to club email address to confirm identity
router.post("/forgot-password", (req, res) => {
  console.log(req.body.username);
  Club.findOne({ username: req.body.username })
    .then((club) => {
      if (club) {
        Token.findOneAndDelete({ userId: club._id })
          .then((token) => {
            if (token) {
              if (club) res.json({ message: "Token Deleted!" });
              else res.json("Token NOT FOUND!");
            }
            let resetToken = crypto.randomBytes(32).toString("hex");

            const link = `www.clubenrolmentportal.com/passwordReset?token=${resetToken}&id=${club._id}`;

            sendMail("reset", link);

            const newToken = new Token({
              userId: club._id,
              token: resetToken,
              createdAt: Date.now(),
            });

            newToken
              .save()
              .catch((error) => res.status(400).json("Error: " + error));

            res.json({
              message: "Email sent!",
              resetToken: newToken,
            });
          })
          .catch((error) => res.status(400).json("Error: " + error));
      }
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Updates club password
router.post("/update-password", (req, res) => {
  Token.findOne({ userId: req.body.userId })
    .then((token) => {
      if (token) {
        bcrypt
          .hash(req.body.newPassword, saltRounds)
          .then((password) => {
            Club.findOneAndUpdate(
              { userId: req.body.userId },
              { password: password }
            )
              .then((club) => {
                if (club) {
                  sendMail("updated!");
                  res.json({
                    message: "Club password updated! ",
                    data: club,
                  });
                } else res.status(404).json("Error: Club NOT FOUND!");
              })
              .catch((error) => res.status(400).json("Error: " + error));
          })
          .catch((error) => res.status(400).json("Error: " + error));
      } else res.status(404).json("Error: Token NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

module.exports = router;
