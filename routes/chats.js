const router = require("express").Router();

const verifyToken = require("../middlewares/verifyToken");
let { Chat } = require("../models");

//Gets all messages between a user and club
router.get("/messages", (req, res) => {
  //   console.log(req.query);
  const { userId, clubId } = req.query;

  Chat.findOne({ userId, clubId })
    .then((chat) => {
      if (!chat) {
        // Create a new chat if it doesn't exist
        const newChat = new Chat({
          userId,
          clubId,
          messages: [],
        });

        newChat
          .save()
          .then(() => {
            res.json({ messages: [] });
          })
          .catch(() => {
            res
              .status(500)
              .json({ message: "Server error. Please try again." });
          });
      } else {
        const messages = chat.messages;
        res.status(200).json({ messages });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Server error. Please try again." });
    });
  //   console.log(req.query.userId);
  //   console.log(req.query.clubId);
  //   Chat.find({ userId: req.query.userId, clubId: req.body.clubId })
  //     .then((chat) => {
  //       if (chat) res.json({ message: "Request Successful!", data: chat });
  //       else res.status(404).json("Error: No records found!");
  //     })
  //     .catch((error) => res.status(200).json("Error: " + error));
});

//Saves new messages between user and club
router.post("/send", (req, res) => {
  Chat.find({ userId: req.body.userId, clubId: req.body.clubId })
    .then((chat) => {
      if (chat.length) {
        Chat.findOneAndUpdate(
          { userId: req.body.userId, clubId: req.body.clubId },
          {
            $push: {
              messages: req.body.messages[0],
            },
          },
          { returnDocument: "after" }
        )
          .then((chats) =>
            res.json({ message: "New Message Sent!", data: chats })
          )
          .catch((error) => res.status(400).json("Error: " + error));
      } else {
        const newChat = new Chat(req.body);

        newChat
          .save()
          .then((chat) =>
            res.json({ message: "New Chat Created!", data: chat })
          )
          .catch((error) => res.status(400).json("Error: " + error));
      }
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

//Deletes a chat
router.delete("/:id", verifyToken("both"), (req, res) => {
  Chat.findOneAndDelete({ id: req.params.id })
    .then((chat) => {
      if (chat) res.json({ message: "Chat Deleted!" });
      else res.status(404).json("Error: Chat NOT FOUND!");
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

module.exports = router;
