const express = require("express");
const prim = require("@prisma/client");
const path = require("path");
const bodyParser = require("body-parser");
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const hbs = require("hbs");

const prisma = new prim.PrismaClient();
const app = express();

const oneDay = 1000 * 60 * 60 * 24;
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

// {{{MIDDLEWARE
hbs.registerHelper("viewBug", (aString) => {
  return "/dashboard/" + aString;
});

hbs.registerHelper("createBug", (aString) => {
  return "/createBugs/" + aString;
});

hbs.registerHelper("updateBug", (aString) => {
  return "/api/updateBugs/" + aString;
});

const auth = (req, res, next) => {
  try {
    if (!req.session.userid) {
      return res
        .status(403)
        .render("error", { message: "Not logged in!", redirectPage: "/login" });
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
    res.status(500);
  }
};

const memberAuth = (req, res, next) => {
  try {
    if (!req.session.eid) {
      res.status(403).send({ message: "You're not an employee!" });
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
    res.status(500);
  }
};

const leaderAuth = (req, res, next) => {
  try {
    if (!req.session.isLeader) {
      res.status(403).send({ message: "You're not an leader!" });
    } else {
      next();
    }
  } catch (err) {
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
app.set("views/pages", path.join(__dirname));
app.set("view engine", "hbs");
// }}}

//{{{LOGIN PAGE
app.all("/login", async (req, res) => {
  try {
    if (req.session.userid) {
      return res.redirect("/");
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
          return res
            .status(404)
            .render("error", { message: "Incorrect email/password" });
        }
      } else {
        return res
          .status(404)
          .render("error", { message: "Incorrect email/password" });
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
        session.isLeader = employee.isLeader;
      }

      return res.status(200).redirect("/");
    }

    return res.render("signin");
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
    return res.status(200).redirect("/login");
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Logout Error!" });
  }
});
//}}}

//{{{REGISTER PAGE
app.all("/register", async (req, res) => {
  try {
    if (req.session.userid) {
      return res.redirect("/");
    }

    if (req.method == "POST") {
      const frontData = req.body;

      if (frontData.password != frontData.confirm_password) {
        return res.status(200).send({ message: "Passwords don't match!" });
      }
      const password = bcrypt.hashSync(frontData.password, salt);

      const user = await prisma.user.create({
        data: {
          username: frontData.username,
          email: frontData.email,
          password: password,
        },
      });

      res.status(200).send({ message: "Register Successful!" });
    }
    return res.render("register");
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err });
  }
});
//}}}

//{{{VIEW PROJECTS PAGE
app.get("/", auth, async (req, res) => {
  try {
    console.log(req.session);
    const projects = await prisma.project.findMany({
      include: {
        bugs: true,
        team: {
          select: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    console.log(projects);

    return res.render("project", { projects: projects });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err });
  }
});
//}}}

//{{{DASHBOARD PAGE
app.get("/dashboard/:id", auth, async (req, res) => {
  try {
    console.log(req.session);
    var bugs = await prisma.bug.findMany({
      where: {
        projectId: parseInt(req.params.id),
      },
      include: {
        handler: {
          include: {
            user: true,
          },
        },
      },
    });

    return res.render("dashboard", { bugs: bugs });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err });
  }
});
//}}}

//{{{CREATE PROJECTS PAGE
//app.all("/createProject", auth, async (req, res) => {
app.all("/createProject", async (req, res) => {
  try {
    if (req.method == "POST") {
      const frontData = req.body;
      console.log(req.session);
      const employee = await prisma.employee.findFirst({
        where: {
          id: req.session.eid,
        },
      });

      const project = await prisma.project.create({
        data: {
          name: frontData.projectName,
          description: frontData.desc,
          teamId: employee.teamId,
        },
      });
      console.log(project);
      res.status(200).redirect("/");
    }
    return res.render("createProject");
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
  }
});
//}}}

//{{{CREATE BUGS PAGE
app.all("/createBugs/:id", async (req, res) => {
  try {
    if (req.method == "POST") {
      const frontData = req.body;
      console.log(frontData);
      var deadline = new Date(frontData.deadline);
      const bug = await prisma.bug.create({
        data: {
          raisedBy: frontData.reportedBy,
          description: frontData.desc,
          threatLevel: parseInt(frontData.level[0]),
          deadline: deadline,
          resolved: frontData.resolved,
          projectId: parseInt(req.params.id),
        },
      });
      console.log(bug);
      res.status(200).redirect("/");
    }
    return res.render("createBug", { id: parseInt(req.params.id) });
  } catch (err) {
    res.status(500).send({ message: err });
  }
});
//}}}

//{{{CHANGE BUG STATUS
app.get("/api/updateBugs/:id", async (req, res) => {
  try {
    const bug = await prisma.bug.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        resolved: true,
      },
    });
    return res.status(200).redirect("/");
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err });
  }
});
//}}}

// BACKEND API

//{{{REASSIGN BUGS
app.post("/api/assignBugs/:id", async (req, res) => {
  try {
    const frontData = req.body;
    const bug = await prisma.bug.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        handlerId: frontData.handlerId,
      },
    });
    console.log(bug);
    res.status(200).send({ message: "Bug reassigned!" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
  }
});
//}}}

//{{{CREATE BUGS
app.post("/api/createBugs/:id", async (req, res) => {
  try {
    const frontData = req.body;
    const bug = await prisma.bug.create({
      data: {
        raisedBy: frontData.raisedBy,
        description: frontData.description,
        threatLevel: frontData.threatLevel,
        deadline: frontData.deadline,
        resolved: frontData.resolved,
        projectId: parseInt(req.params.id),
      },
    });
    console.log(bug);
    res.status(200).send({ message: "Bug successfully created!" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
  }
});
//}}}

//{{{VIEW BUGS
app.get("/api/listBugs/:id", async (req, res) => {
  try {
    console.log(req.session);
    const bugs = await prisma.bug.findMany({
      where: {
        projectId: parseInt(req.params.id),
      },
    });
    console.log(bugs);
    res
      .status(200)
      .send({ data: bugs, message: "Projects list request successful!" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
  }
});
//}}}

//{{{CREATE COMMENTS
app.post("/api/createComment/:id", async (req, res) => {
  try {
    const frontData = req.body;
    const comments = await prisma.comment.create({
      data: {
        body: frontData.body,
        bugId: parseInt(req.params.id),
        commenterId: frontData.commenterId,
      },
    });
    console.log(comments);
    res.status(200).send({ message: "Comments successfully created!" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
  }
});
//}}}

//{{{VIEW COMMENTS
app.get("/api/listComments/:id", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        bugId: parseInt(req.params.id),
      },
    });
    console.log(comments);
    res
      .status(200)
      .send({ data: comments, message: "Comments list request successful!" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
  }
});
//}}}

const port = process.env.PORT2 || 3001;
app.listen(port, () => console.log(`listening on port ${port}`));
