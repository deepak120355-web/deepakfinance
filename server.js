
require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.static("public"));

const catalogue = {
  "stock-market-basics": {
    name: "Stock Market Basics",
    pricePaise: 49900
  },
  "technical-analysis": {
    name: "Technical Analysis Guide",
    pricePaise: 69900
  },
  "trading-strategies": {
    name: "Trading Strategies Handbook",
    pricePaise: 89900
  }
};

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured.");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

app.post("/api/create-order", async (req, res) => {
  try {
    let productIds = req.body && req.body.productIds;

    if (!productIds && req.body && req.body.productId) {
      productIds = [req.body.productId];
    }

    if (
      !Array.isArray(productIds) ||
      productIds.length < 1 ||
      productIds.length > 3 ||
      productIds.some(id => typeof id !== "string") ||
      new Set(productIds).size !== productIds.length
    ) {
      return res.status(400).json({ error: "Invalid cart." });
    }

    const items = productIds.map(id => catalogue[id]);

    if (items.some(item => !item)) {
      return res.status(400).json({ error: "Unknown product in cart." });
    }

    const totalAmount = items.reduce(
      (total, item) => total + item.pricePaise, 0
    );

    const productName = items.map(item => item.name).join(", ");

    const order = await getRazorpay().orders.create({
      amount: totalAmount,
      currency: "INR",
      receipt: "df_" + Date.now()
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      productName
    });

  } catch (error) {
    console.error("Create order error:", error.message);
    return res.status(500).json({
      error: "Could not create test order. Check Razorpay settings in Render."
    });
  }
});

app.post("/api/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body || {};

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !/^[a-f0-9]{64}$/i.test(razorpay_signature)
    ) {
      return res.status(400).json({
        verified: false,
        error: "Missing or invalid payment details."
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        verified: false,
        error: "Payment verification is not configured."
      });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(razorpay_signature, "hex");

    const verified =
      a.length === b.length &&
      crypto.timingSafeEqual(a, b);

    return res.status(verified ? 200 : 400).json({
      verified,
      ...(verified ? {} : {
        error: "Payment signature verification failed."
      })
    });

  } catch (error) {
    console.error("Verify payment error:", error.message);
    return res.status(500).json({
      verified: false,
      error: "Could not verify payment."
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`deepakfinance running on port ${port}`);
});
