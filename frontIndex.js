const express = require("express");
const prim = require("@prisma/client");
const path = require("path");
const bodyParser = require("body-parser");
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const ejs = require("ejs");

const prisma = new prim.PrismaClient();
const app = express();

const oneDay = 1000 * 60 * 60 * 24;

// {{{MIDDLEWARE
auth = (req, res, next) => {
  try {
    console.log(req.session);
    if (!req.session.userid) {
      res.status(403).send({ message: "Not logged in!" });
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
    res.status(500);
  }
};

app.use(
  sessions({
    secret: "process.env.SECRET_KEY",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  //console.log("Time:", Date.now());
  next();
});

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "pages")));
app.set("view engine", "ejs");
// }}}

//{{{LOGIN PAGE
app.all("/login", async (req, res) => {
  try {
    if (req.session.userid) {
      //return res.redirect("/");
      console.log(req.session);
      return res.status(200).send({ message: "Already logged in" });
    }

    if (req.method == "POST") {
      const frontData = req.body;

      user = await prisma.user.findUnique({
        where: {
          email: frontData.email,
        },
      });

      if (user != null) {
        if (!bcrypt.compareSync(frontData.password, user.password)) {
          return res.status(404).send({ message: "Incorrect email/password" });
        }
      } else {
        return res.status(404).send({ message: "Incorrect email/password" });
      }

      const employee = await prisma.employee.findFirst({
        where: {
          user: {
            email: frontData.email,
          },
        },
      });

      session = req.session;
      session.userid = frontData.email;
      if (employee != null) {
        session.eid = employee.id;
      }

      return res.status(200).send({ message: "Success" });
      //return res.status(200).redirect("/");
    }

    return res.status(200).sendFile(path.join(__dirname, "/pages/login.html"));
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err });
  }
});
//}}}

//{{{LOGOUT
app.get("/logout", auth, (req, res) => {
  try {
    req.session.destroy();
    console.log(req.session);
    return res.status(200).send({ message: "Successfully Logged out!" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Logout Error!" });
  }
});
//}}}

//{{{REGISTER PAGE
app.get("/register", (req, res) => {
  try {
    if (req.session.userid) {
      return res.status(200).send({ message: "Already logged in" });
      //return res.redirect("/");
    }
    return res
      .status(200)
      .sendFile(path.join(__dirname, "/pages/register.html"));
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err });
  }
});
//}}}

//{{{DASHBOARD PAGE
app.get("/dashboard", auth, (req, res) => {
  try {
    return res
      .status(200)
      .sendFile(path.join(__dirname, "/pages/dashboard.html"));
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err });
  }
});
//}}}

const port = process.env.PORT2 || 3001;
app.listen(port, () => console.log(`listening on port ${port}`));
