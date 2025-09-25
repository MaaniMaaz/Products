const dotenv = require("dotenv");
const Stripe = require("stripe");
const Order = require("../models/Order");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");

dotenv.config({ path: "./src/config/config.env" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Create Customer (helper function)
const createCustomerHelper = async (name, email) => {
  const customer = await stripe.customers.create({ name, email });
  return customer.id;
};

// ✅ API endpoint: create customer directly
const createCustomer = async (req, res) => {
  try {
    const { name, email } = req.user || req.body; // support both auth user or form

    if (!email) {
      return ErrorHandler("Email is required", 400, req, res);
    }

    const customerId = await createCustomerHelper(name, email);

    return SuccessHandler(
      "Customer created successfully",
      { customerId },
      req,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// ✅ API endpoint: create checkout session
const createCheckoutSession = async (req, res) => {
  try {
    const { _id,total, products, clientDetails, billingAddress, preference, tax, totalPrice } = req.body;
     const { id: user } = req.user; 

    const customerId = await createCustomerHelper(
      clientDetails?.name,
      clientDetails?.email
    );
    if (!customerId) {
      return ErrorHandler("Customer ID is required", 400, req, res);
    }

    //  const order = new Order({
    //   user,
    //   products,
    //   clientDetails,
    //   billingAddress,
    //   preference,
    //   tax,
    //   totalPrice,
    //   status:"pending"
    // });

    // order.save()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["us_bank_account", "customer_balance"],

      payment_method_options: {
        customer_balance: {
          funding_type: "bank_transfer",
          bank_transfer: {
            type: "us_bank_transfer",
          },
        },
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Example Product" },
            unit_amount: Number(totalPrice) * 100,
          },
          quantity: 1,
        },
      ],

      mode: "payment",

      // ✅ success/cancel URLs only redirect (no sensitive data)
      success_url: "https://products-fe-three.vercel.app/dashboard/payment-success",
      cancel_url: "https://products-fe-three.vercel.app/dashboard/payment-failed",

      customer: customerId,

      // ✅ Store the full request body as metadata (must be strings)
       metadata: {
        orderId: _id.toString(),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};


// ✅ Webhook (to handle Stripe events like payment success)
const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  console.log(sig, process.env.STRIPE_WEBHOOK_SECRET);
  try {
    // IMPORTANT: make sure your express route uses express.raw({ type: 'application/json' })
    
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        status: "pending",
        stripeSessionId: session.id,
        paymentReceivedAt: new Date(),
        // optional: store raw session for audit
        // stripeSession: session,
      });
      console.log("Order marked paid:", orderId);
    } else {
      console.warn("No orderId in metadata for session:", session.id);
    }
  }

  return res.json({ received: true });
};



module.exports = {
  createCustomer,
  createCheckoutSession,
  stripeWebhook,
};
