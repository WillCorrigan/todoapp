const dbConnect = require("./db/dbConnect");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("./db/userModel");
const Todo = require("./db/todoModel");
const express = require("express");
const jwt = require("jsonwebtoken");
const auth = require("./auth");
const cors = require("cors");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 3000;

dbConnect();

app.get("/", (req, res, next) => {
  res.json({ message: "This is your server" });
  next();
});

app.post("/register", async (req, res) => {
  await bcrypt
    .hash(req.body.password, 10)
    .then((hashedPassword) => {
      const user = new User({
        email: req.body.email,
        password: hashedPassword,
      });
      user
        .save()
        .then((result) => {
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            process.env.JWT_TOKEN,
            { expiresIn: "24h" }
          );

          res.status(201).send({
            message: "User created successfully",
            result,
            token,
          });
        })
        .catch((err) => {
          res.status(500).send({
            message: "Error creating user",
            err,
          });
        });
    })
    .catch((err) => {
      res.status(500).send({
        message: "Password was not hashed successfully",
        err,
      });
    });
});

app.post("/login", async (req, res) => {
  await User.findOne({ email: req.body.email })
    .then((user) => {
      bcrypt
        .compare(req.body.password, user.password)
        .then((passwordMatch) => {
          if (!passwordMatch) {
            return res.status(400).send({
              message: "Password does not match",
            });
          }

          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            process.env.JWT_TOKEN,
            { expiresIn: "24h" }
          );

          res.status(200).send({
            message: "Login successful",
            email: user.email,
            token,
          });
        })
        .catch((err) => {
          res.status(400).send({
            message: "You haven't sent the right details you silly sausage.",
            err,
          });
        });
    })
    .catch((err) => {
      res.status(404).send({
        message: "Email not found.",
        err,
      });
    });
});

app.get("/todo/list", auth, async (req, res) => {
  await User.findOne({ email: req.user.userEmail })
    .populate("todoList")
    .then((user) => {
      res.status(200).send({
        todos: user.todoList,
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "Can't find user",
        err,
      });
    });
});

app.post("/todo/add", auth, async (req, res) => {
  await User.findOne({ email: req.user.userEmail })
    .then((user) => {
      new Todo({
        title: req.body.title,
        completed: req.body.completed,
        archived: req.body.archived,
        user: req.user.userId,
      })
        .save()
        .then((todo) => {
          user.todoList.push(todo);
          user.save();
          res.status(200).send({
            todo,
          });
        })
        .catch((err) => {
          res.status(400).send({
            message: "Unable to save todo",
            err,
          });
        });
    })
    .catch((err) => {
      res.status(404).send({
        message: "Can't find user.",
        err,
      });
    });
});

app.put("/todo/update", auth, async (req, res) => {
  await Todo.findByIdAndUpdate(
    req.body._id,
    {
      title: req.body.title,
      completed: req.body.completed,
      archived: req.body.archived,
    },
    { new: true }
  )
    .then((todo) => {
      todo.save();
      res.status(200).send({
        newTodo: todo,
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "Unable to update todo",
        err,
      });
    });
});

app.get("/no-auth-needed", (req, res) => {
  res.json({
    message: "No auth needed here",
  });
});

app.get("/auth-needed", auth, async (req, res) => {
  res.json({
    message: "You are authenticated",
  });
});

app.listen(port, () => {
  console.log("Server running.");
});

module.exports = app;
