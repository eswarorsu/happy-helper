console.log("🚀 INDEX.JS STARTED");

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/payment", paymentRoutes);

// ✅ CORRECT PORT HANDLING FOR RENDER
const PORT = process.env.PORT || 5050;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// 🔴 CATCH SERVER ERRORS
server.on("error", (err) => {
  console.error("❌ SERVER ERROR:", err);
});



