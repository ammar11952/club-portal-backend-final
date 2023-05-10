const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const {
  chatsRoutes,
  clubsRoutes,
  eventsRoutes,
  membershipsRoutes,
  usersRoutes,
  transactionsRoutes,
} = require("./routes");

dotenv.config();

const port = process.env.PORT || 8080;

const uri = process.env.URI;

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected!"))
  .catch((error) => console.log("Error: " + error));

app.use("/chats", chatsRoutes);
app.use("/clubs", clubsRoutes);
app.use("/events", eventsRoutes);
app.use("/memberships", membershipsRoutes);
app.use("/users", usersRoutes);
app.use("/transactions", transactionsRoutes);

app.listen(port, () => {
  console.log("Server listening on port: " + port);
});
