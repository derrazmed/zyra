# Zyra – Smart Trading Platform

This project is composed of:

* **Backend** → `zyra-trading` (Spring Boot)
* **Frontend** → `zyra-app` (React + Vite)

It connects to Binance Testnet to simulate trading and display real-time market data.

---

# 🚀 Project Structure

```id="n6m1xk"
zyra/
├── zyra-trading/   → Spring Boot backend
├── zyra-app/       → React frontend
```

---

# 🧩 Requirements

Make sure you have:

* Node.js (>= 18)
* npm or yarn
* Java 17+
* Maven
* Git

---

# ▶️ Run the Backend (zyra-trading)

```bash id="5z0m2q"
cd zyra-trading
mvn spring-boot:run
```

Backend runs on:

```id="l7r2vy"
http://localhost:8080
```

---

# ▶️ Run the Frontend (zyra-app)

```bash id="9v4d5a"
cd zyra-app
npm install
npm run dev
```

Frontend runs on:

```id="3xq8fw"
http://localhost:5173
```

---

# 🔗 Backend Configuration

Ensure backend is running before frontend.

CORS must allow:

```id="2m5b0r"
http://localhost:5173
```

---

# 🔑 Binance Testnet API Setup

To enable trading and account features, you need Testnet API keys.

---

## 1. Access Binance Testnet

👉 https://testnet.binance.vision/

Login using your GitHub account.

---

## 2. Generate API Keys

* Click **"Generate API Key"**
* Give it a name (e.g. `zyra-test`)
* Copy:

```id="q4c1kp"
API KEY
SECRET KEY
```

⚠️ The **secret key is shown only once** — save it immediately.

---

## 3. Permissions

Enable:

* ✅ Spot Trading
* ❌ Withdrawals (keep disabled)

---

# 🔌 Connect API Keys in Zyra

Go to:

```id="h7k2vc"
http://localhost:5173/integrations
```

Fill:

* API Key
* Secret Key
* Label (e.g. "Testnet")

Then:

```id="8u1p3y"
Validate → Save Configuration
```

---

# ⚠️ Important Notes

* Testnet funds are fake (for testing only)
* Prices may slightly differ from real Binance
* First load may take a few seconds (WebSocket streams initialize)

---

# 👨‍💻 Project

Zyra Smart Trading Platform
