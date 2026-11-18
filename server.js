require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});
app.use(express.json());
app.use(express.static("public"));

const catalogue = {
  "stock-market-basics": { name: "Stock Market Basics", pricePaise: 49900 },
  "technical-analysis": { name: "Technical Analysis Guide", pricePaise: 69900 },
  "trading-strategies": { name: "Trading Strategies Handbook", pricePaise: 89900 }
};

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay test keys are not configured. Add them to your .env file.");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

app.post("/api/create-order", async (req, res) => {
  try {
    const item = catalogue[req.body.productId];
    if (!item) return res.status(400).json({ error: "Unknown product." });

    const order = await getRazorpay().orders.create({
      amount: item.pricePaise,
      currency: "INR",
      receipt: "df_" + Date.now()
    });
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      productName: item.name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create test order. Check server configuration." });
  }
});

app.post("/api/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ verified: false, error: "Missing payment details." });
  }
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(razorpay_signature);
  const verified = a.length === b.length && crypto.timingSafeEqual(a, b);
  res.status(verified ? 200 : 400).json({ verified });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`deepakfinance running at http://localhost:${port}`));
