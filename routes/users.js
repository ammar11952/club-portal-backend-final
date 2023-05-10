const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const crypto = require("crypto");
const fs = require("fs");
const util = require("util");
const multer = require("multer");

dotenv.config();

const saltRounds = 10;
const upload = multer({ dest: "uploads/" });
const unlinkFile = util.promisify(fs.unlink);
const { uploadFile, deleteFile } = require("../utils/s3");
const sendMail = require("../utils/sendMail");
const { verifyToken } = require("../middlewares");
//const { userValidator } = require('../validators');
let { User, Token } = require("../models");

//Logins a user
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("user" + email);
  if (email && password) {
    User.findOne({ email })
      .then((user) => {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result == true) {
              // let token = jwt.sign(
              //   { username, issuer: "user" },
              //   process.env.SECRET,
              //   {
              //     expiresIn: "24h",
              //   }
              // );
              res.json({
                message: "Authentication Successful!",
                // authToken: token,
                user,
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

//Search for a user
router.get("/search/:keyword", verifyToken("both"), (req, res) => {
  User.find({
    $text: {
      $search: req.params.keyword,
      $caseSensitive: false,
    },
  })
    .then((users) => {
      if (users.length) res.json({ message: "Match found!", data: users });
      else res.json({ message: "No match found!", data: users });
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Gets user details
router.get("/:id", verifyToken("both"), (req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      if (user) res.json(user);
      else res.status(404).json("Error: User NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Signs up a new user
router.post("/create", upload.single("image"), async (req, res) => {
  console.log("Req body in users");
  console.log(req.body);
  let userKey = "",
    userPicture = "";

  if (req.body.picture == "yes") {
    const result = await uploadFile(req.file);
    await unlinkFile(req.file.path);
    console.log(result);
    userPicture = result.Location;
    userKey = result.Key;
  }

  bcrypt
    .hash(req.body.password, saltRounds)
    .then((password) => {
      req.body.password = password;
      const newUser = new User(req.body);
      newUser.picture = userPicture;
      newUser.awsKey = userKey;

      newUser
        .save()
        .then((user) =>
          res.json({
            message: "New User Created!",
            data: user,
          })
        )
        .catch((error) => res.status(400).json("Error: " + error));
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Edits user details (Except username, email address and picture)
router.put("/edit/:id", verifyToken("user"), async (req, res) => {
  User.findOneAndUpdate({ _id: req.params.id }, req.body)
    .then((user) => {
      if (user) res.json("User Updated!");
      else res.status(404).json("Error: User NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Edits user picture
router.put(
  "/edit-picture/:id",
  upload.single("image"),
  verifyToken("user"),
  async (req, res) => {
    const result = await uploadFile(req.file);
    await unlinkFile(req.file.path);
    console.log(result);

    User.findOneAndUpdate(
      { _id: req.params.id },
      { picture: result.Location },
      { returnDocument: "after" }
    )
      .then((user) => {
        deleteFile(user.awsKey);
        res.json({
          message: "User Picture Updated!",
          data: user,
        });
      })
      .catch((error) => res.status(400).json("Error: " + error));
  }
);
// Changes a user's password
router.put("/changepassword", (req, res) => {
  console.log("req.body");
  console.log(req.body);
  const userId = req.body.userId;
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  User.findById(userId)
    .then((user) => {
      bcrypt
        .compare(currentPassword, user.password)
        .then((result) => {
          if (result == true) {
            bcrypt.hash(newPassword, saltRounds, (error, hash) => {
              if (error) {
                res.status(400).json("Could NOT hash password! " + error);
              } else {
                User.findByIdAndUpdate(
                  userId,
                  { $set: { password: hash } },
                  { new: true }
                )
                  .then((user) => {
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

//Deletes user
router.delete("/delete/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        res.json({
          message: "User Deleted!",
        });
      } else res.status(404).json("Error: User NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Sends email to user email address to confirm identity
router.post("/forgot-password", (req, res) => {
  console.log(req.body.username);
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        Token.findOneAndDelete({ userId: user._id })
          .then((token) => {
            if (token) {
              if (user) res.json({ message: "Token Deleted!" });
              else res.json("Token NOT FOUND!");
            }
            let resetToken = crypto.randomBytes(32).toString("hex");

            const link = `www.clubenrolmentportal.com/passwordReset?token=${resetToken}&id=${user._id}`;

            sendMail(user.email, "reset", link);

            const newToken = new Token({
              userId: user._id,
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

//Updates user password
router.post("/update-password", (req, res) => {
  Token.findOne({ userId: req.body.userId })
    .then((token) => {
      if (token) {
        bcrypt
          .hash(req.body.newPassword, saltRounds)
          .then((password) => {
            User.findOneAndUpdate(
              { userId: req.body.userId },
              { password: password }
            )
              .then((user) => {
                if (user) {
                  sendMail("updated!");
                  res.json({
                    message: "User password updated! ",
                    data: user,
                  });
                } else res.status(404).json("Error: User NOT FOUND!");
              })
              .catch((error) => res.status(400).json("Error: " + error));
          })
          .catch((error) => res.status(400).json("Error: " + error));
      } else res.status(404).json("Error: Token NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

module.exports = router;
