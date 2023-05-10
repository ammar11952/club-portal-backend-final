const express = require("express");
const router = express.Router();
let { Transaction } = require("../models");

// GET all transactions
router.get("/:userId", (req, res) => {
  //   console.log(req.params.userId);
  const userId = req.params.userId;
  Transaction.find({ userId })
    .populate("eventId")
    .then((transactions) => {
      const eventIds = transactions.map((transaction) => transaction.eventId);
      res.status(200).json(eventIds);
    })
    .catch((error) => res.status(400).json("Error: " + error));
});

// GET a specific transaction by ID
router.get("/:id", (req, res) => {
  Transaction.findById(req.params.id)
    .then((transaction) => res.json(transaction))
    .catch((error) => res.status(400).json("Error: " + error));
});

// POST a new transaction
router.post("/", (req, res) => {
  const { userId, eventId, amount, currency } = req.body;

  const newTransaction = new Transaction({ userId, eventId, amount, currency });

  newTransaction
    .save()
    .then(() => res.json("Transaction added!"))
    .catch((error) => res.status(400).json("Error: " + error));
});

// DELETE a transaction by ID
router.delete("/:id", (req, res) => {
  Transaction.findByIdAndDelete(req.params.id)
    .then(() => res.json("Transaction deleted."))
    .catch((error) => res.status(400).json("Error: " + error));
});

// UPDATE a transaction by ID
router.patch("/:id", (req, res) => {
  Transaction.findByIdAndUpdate(req.params.id, req.body)
    .then(() => res.json("Transaction updated."))
    .catch((error) => res.status(400).json("Error: " + error));
});

module.exports = router;
