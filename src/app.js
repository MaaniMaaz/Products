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
const Order = require("./models/Order");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const moment = require('moment')
const Stripe = require("stripe");
const { CronJob } = require("cron");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      case "checkout.session.completed":
        const paymentIntentSucceeded = event.data.object;
        console.log("paymentItnennnnnn", paymentIntentSucceeded);

        const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        status: "paid",
        stripeSessionId: session.id,
        paymentReceivedAt: new Date(),
        // optional: store raw session for audit
        // stripeSession: session,
      });
      console.log("Order marked paid:", orderId);
    } else {
      console.warn("No orderId in metadata for session:", session.id);
    }
        break;

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


const updateProducts = new CronJob(
  "0 0 0 * * *",
  async () => {
   try {
    console.log("⏰ Running daily product update job...");

    // Call your update API (assuming backend runs locally on port 5000)
    await axios.get("https://products-s9xv.onrender.com/product/update-product");

    console.log("✅ Product update completed");
  } catch (error) {
    console.error("❌ Error running daily product update:", error.message);
  }
  },
  null,
  true,
  // "America/Los_Angeles"
);

updateProducts.start();

module.exports = app;
