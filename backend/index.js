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
const server = app.listen(5050, () => {
  console.log("✅ Server is listening on http://localhost:5050");
});

// 🔴 CATCH SILENT FAILURES
server.on("error", (err) => {
  console.error("❌ SERVER ERROR:", err);
});

