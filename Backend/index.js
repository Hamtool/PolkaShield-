import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ApiPromise, WsProvider } from "@polkadot/api";

dotenv.config();
console.log("Loaded RPC_URL:", process.env.RPC_URL);

const app = express();
app.use(cors());
app.use(express.json());

let api;
let status = "Connecting...";

async function connectPolkadot() {
  try {
    const provider = new WsProvider(process.env.RPC_URL);
    api = await ApiPromise.create({ provider });
    status = "Connected";
    console.log("✅ Connected to Polkadot Node");
  } catch (error) {
    status = "Reconnecting...";
    console.error("RPC connection failed, retrying in 5s...", error.message || error);
    setTimeout(connectPolkadot, 5000);
  }
}
connectPolkadot();

app.get("/status", (req, res) => res.json({ status }));

app.get("/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!api) return res.status(503).json({ error: "RPC not connected" });
    const { data } = await api.query.system.account(address);
    res.json({ balance: data.free.toHuman() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

let messages = [];
app.post("/signatures", (req, res) => {
  const { address, signature } = req.body;
  if (!address || !signature) return res.status(400).json({ error: "address and signature required" });
  messages.push({ address, signature, timestamp: Date.now() });
  res.json({ success: true, total: messages.length });
});
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

app.get("/signatures", (req, res) => res.json(messages));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
