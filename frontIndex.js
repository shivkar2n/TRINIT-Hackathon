const express = require("express");
const prim = require("@prisma/client");
const path = require("path");
const bodyParser = require("body-parser");
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");

const port = process.env.PORT2 || 3001;
app.listen(port, () => console.log(`listening on port ${port}`));
