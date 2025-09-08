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
const user = require("./models/User/user");
const League = require("./models/League/league");
const Team = require("./models/League/team");
const { CronJob } = require("cron");
const sendNotification = require("./utils/pushNotification");
const { handlePayment } = require("./functions/webhook");
const dotenv = require("dotenv");
const adminNotification = require("./utils/adminNotification");
const Season = require("./models/League/season");
dotenv.config({ path: "./config/config.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const moment = require('moment')


console.log(moment().endOf("day").toDate())

console.log(global.onlineUsers);

// Middlewares
app.use(cors());
app.options("*", cors());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(loggerMiddleware);

// webhooks
const endpointSecret = process.env.WEBHOOK_SECRET;

app.post(
  "/webhook",
  bodyParser.raw({ type: "*/*" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;
        console.log("paymentItnennnnnn", paymentIntentSucceeded);

        await handlePayment(
          "success",
          paymentIntentSucceeded.metadata,
          paymentIntentSucceeded
        );
        break;
      case "payment_intent.canceled":
        const paymentIntentCanceled = event.data.object;
        await handlePayment(
          "canceled",
          paymentIntentCanceled.metadata,
          paymentIntentCanceled
        );
        break;
      case "payment_intent.payment_failed":
        const paymentIntentFailed = event.data.object;
        await handlePayment(
          "failed",
          paymentIntentFailed.metadata,
          paymentIntentFailed
        );
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send({ received: true });
  }
);

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

// cron jobs
const endLeagueJob = new CronJob(
  "0 0 0 * * *",

  async () => {
    try {
      const leagues = await League.find({
        status: "ongoing",
        endDate: { $lte: new Date() },
      });
      console.log("leagues.......", leagues);
      const admins = await user.find({ role: "admin" });
      Promise.all(
        leagues.map(async (league) => {
          if (league.endDate <= new Date()) {
            await League.findByIdAndUpdate(league._id, { status: "ended" });
            const teams = await Team.find({ league: league._id });
            Promise.all(
              admins.map(async (admin) => {
                await adminNotification(
                  admin,
                  "League Ended",
                  `League ${league.name} has ended. Please check the results.`,
                  "league-ended",
                  { leagueId: league._id }
                );
              })
            );
            Promise.all(
              teams.map(async (team) => {
                const update = {
                  archivedPlayers: team.players.filter(
                    (player) =>
                      player.player.toString() !== team.captain.toString()
                  ),
                  players: team.players.filter(
                    (player) =>
                      player.player.toString() === team.captain.toString()
                  ),
                  isArchived: true,
                };
                await Team.findOneAndUpdate(
                  { _id: team._id },
                  { $set: update },
                  { new: true }
                );

                const captain = await user.findById(team.captain);

                await sendNotification(
                  captain,
                  "League Ended",
                  `Your team ${team.name} has been archived as the league has ended. Please update your team for the next league.`,
                  "league-ended",
                  { teamId: team._id }
                );
              })
            );
          }
        })
      );
    } catch (error) {
      console.log("error", error.message);
    }
  },
  null,
  true,
  "America/Los_Angeles"
);
const ongoingLeagueJob = new CronJob(
  "0 0 0 * * *",
  async () => {
    const leagues = await League.find({
      status: "upcoming",
      startDate: { $lte: new Date() },
    });
    const today = new Date();

    Promise.all(
      leagues.map(async (league) => {
        if (today >= league.startDate) {
          await League.findByIdAndUpdate(league._id, { status: "ongoing" });
        }
      })
    );
  },
  null,
  true,
  "America/Los_Angeles"
);

endLeagueJob.start();
ongoingLeagueJob.start();
module.exports = app;
