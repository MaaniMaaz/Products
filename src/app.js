const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ApiError = require("./utils/ApiError");
const app = express();
const router = require("./router");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../swagger_output.json"); // Generated Swagger file
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const moment = require('moment')


console.log(moment().endOf("day").toDate())

console.log(global.onlineUsers);

// Middlewares
app.use(cors());
app.options("*", cors());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(loggerMiddleware);


app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// router index
app.use("/", router);
// api doc
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/", async (req, res) => {
  // await Match.updateMany({}, { $set: { status: "pending" } });
  // await Season.insertMany([
  //   { name: "Summer'24" },
  //   { name: "Winter'24" },
  //   { name: "Spring'24" },
  //   { name: "Fall'24" },
  //   { name: "Summer'25" },
  //   { name: "Winter'25" },
  //   { name: "Spring'25" },
  //   { name: "Fall'25" },
  //   { name: "Summer'26" },
  //   { name: "Winter'26" },
  //   { name: "Spring'26" },
  //   { name: "Fall'26" },
  //   { name: "Summer'27" },
  //   { name: "Winter'27" },
  //   { name: "Spring'27" },
  //   { name: "Fall'27" },
  //   { name: "Summer'28" },
  //   { name: "Winter'28" },
  //   { name: "Spring'28" },
  //   { name: "Fall'28" },
  //   { name: "Summer'29" },
  //   { name: "Winter'29" },
  //   { name: "Spring'29" },
  //   { name: "Fall'29" },
  //   { name: "Summer'30" },
  //   { name: "Winter'30" },
  //   { name: "Spring'30" },
  //   { name: "Fall'30" },
  // ]);
  res.send("BE-boilerplate v1.1");
  // await user.updateMany({}, { $set: { isNotificationEnabled: true } });
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(404, "Not found"));
});


module.exports = app;
