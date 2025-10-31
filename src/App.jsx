import { useEffect, useState } from "react";
import axios from "axios";
import { web3Enable, web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";

const BACKEND_URL = "http://127.0.0.1:5000"; // change if you host your backend online

export default function App() {
  const [status, setStatus] = useState("Loading...");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [connected, setConnected] = useState(false);

  // Get backend status
  useEffect(() => {
    axios.get(`${BACKEND_URL}/status`)
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus("Offline"));
  }, []);

  // Connect Polkadot wallet
  async function connectWallet() {
    const extensions = await web3Enable("PolkaShield");
    if (!extensions.length) return alert("No Polkadot.js wallet found!");
    const accs = await web3Accounts();
    setAccounts(accs);
    if (accs.length) setAddress(accs[0].address);
    setConnected(true);
  }

  // Get balance from backend
  async function getBalance() {
    if (!address) return alert("Connect wallet first");
    const res = await axios.get(`${BACKEND_URL}/balance/${address}`);
    setBalance(res.data.balance);
  }

  // Sign message and send to backend
  async function signMessage() {
    if (!address) return alert("Connect wallet first");
    const injector = await web3FromAddress(address);
    const message = `PolkaShield verification - ${Date.now()}`;
    const signed = await injector.signer.signRaw({ address, data: message, type: "bytes" });
    await axios.post(`${BACKEND_URL}/signatures`, { address, signature: signed.signature });
    alert("Signature sent to backend successfully!");
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "30px", maxWidth: "600px", margin: "auto" }}>
      <h1>🛡️ PolkaShield</h1>
      <p>Status: <strong>{status}</strong></p>

      {!connected ? (
        <button onClick={connectWallet}>Connect Polkadot Wallet</button>
      ) : (
        <>
          <p><strong>Connected:</strong> {address}</p>
          <button onClick={getBalance}>Check Balance</button>
          <button onClick={signMessage}>Sign Message</button>
          {balance && <p>Balance: {balance}</p>}
        </>
      )}
    </div>
  );
}
