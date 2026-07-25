require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ticketsRouter = require("./routes/tickets");
const metaRouter = require("./routes/meta");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/tickets", ticketsRouter);
app.use("/api/meta", metaRouter);

// Fallback for unknown routes
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`Support CRM API listening on port ${PORT}`);
});
