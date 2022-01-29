const prim = require("@prisma/client");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const prisma = new prim.PrismaClient();
const app = express();

const port = process.env.PORT1 || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
