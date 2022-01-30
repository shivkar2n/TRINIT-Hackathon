const prim = require("@prisma/client");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const prisma = new prim.PrismaClient();
const app = express();

// {{{ MIDDLEWARE
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  //console.log("Time:", Date.now());
  next();
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));
// }}}

//{{{CREATE PROJECTS
app.post("/api/createProject", async (req, res) => {
  try {
    const frontData = req.body;
    const project = await prisma.project.create({
      data: {
        name: frontData.name,
        teamId: frontData.teamId,
      },
    });
    console.log(project);
    res.status(200).send({ message: "Project successfully created!" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
  }
});
//}}}

//{{{VIEW PROJECTS
app.get("/api/listProjects", async (req, res) => {
  try {
    const projects = await prisma.project.findMany();
    res
      .status(200)
      .send({ data: projects, message: "Projects list request successful!" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
  }
});
//}}}

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
    return res.status(200).redirect("/");
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err });
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
    res.status(200).redirect();
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

const port = process.env.PORT1 || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
