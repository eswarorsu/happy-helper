console.log("🚀 INDEX.JS STARTED");

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";

dotenv.config({ path: "./.env" });

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/payment", paymentRoutes);

// 🔴 FORCE visibility of listen behavior
const PORT = process.env.PORT || 5050;
const server = app.listen(port, () => {
  console.log('✅ Server running on port ${port}');
});

// 🔴 CATCH SILENT FAILURES
server.on("error", (err) => {
  console.error("❌ SERVER ERROR:", err);
});


