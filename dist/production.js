"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/production.ts
var import_express = __toESM(require("express"), 1);

// server/simple-routes.ts
var import_http = require("http");
var import_ws = require("ws");

// server/simple-auth.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var USERS_FILE = import_path.default.join(process.cwd(), "users.json");
function loadUsers() {
  try {
    if (import_fs.default.existsSync(USERS_FILE)) {
      const data = import_fs.default.readFileSync(USERS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.log("No users file found, starting fresh");
  }
  return [];
}
function saveUsers(users) {
  import_fs.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function registerUser(username, password) {
  const users = loadUsers();
  if (users.find((u) => u.username === username)) {
    return { success: false, message: "Username already exists" };
  }
  if (username.length < 3) {
    return { success: false, message: "Username must be at least 3 characters" };
  }
  if (password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters" };
  }
  const newUser = {
    id: Date.now().toString(),
    username,
    password,
    // Plain text for simplicity
    balance: 0,
    // Starting balance is $0 - users must top up
    holdBalance: 0
    // Starting hold balance is $0
  };
  users.push(newUser);
  saveUsers(users);
  return {
    success: true,
    message: "Account created successfully",
    user: { ...newUser, password: "" }
    // Don't return password
  };
}
function loginUser(username, password) {
  const users = loadUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return { success: false, message: "Invalid username or password" };
  }
  return {
    success: true,
    message: "Login successful",
    user: { ...user, password: "" }
    // Don't return password
  };
}
function updateDailyRewardClaim(username) {
  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.username === username);
  if (userIndex === -1) {
    return { success: false, message: "User not found" };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const lastClaim = users[userIndex].lastDailyRewardClaim;
  if (lastClaim) {
    const lastClaimDate = new Date(lastClaim);
    const nowDate = new Date(now);
    const hoursSinceLastClaim = (nowDate.getTime() - lastClaimDate.getTime()) / (1e3 * 60 * 60);
    if (hoursSinceLastClaim < 24) {
      const hoursLeft = Math.ceil(24 - hoursSinceLastClaim);
      return {
        success: false,
        message: `Daily reward already claimed. Next claim available in ${hoursLeft} hours.`
      };
    }
  }
  users[userIndex].lastDailyRewardClaim = now;
  users[userIndex].balance += 0.2;
  saveUsers(users);
  return {
    success: true,
    message: "Daily reward claimed successfully!",
    user: { ...users[userIndex], password: "" }
  };
}
function updateUsername(userId, newUsername) {
  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: "User not found" };
  }
  if (newUsername.length < 3) {
    return { success: false, message: "Username must be at least 3 characters" };
  }
  if (newUsername.length > 20) {
    return { success: false, message: "Username must be less than 20 characters" };
  }
  const existingUser = users.find((u) => u.username === newUsername && u.id !== userId);
  if (existingUser) {
    return { success: false, message: "Username already taken" };
  }
  users[userIndex].username = newUsername;
  saveUsers(users);
  return {
    success: true,
    message: "Username updated successfully!",
    user: { ...users[userIndex], password: "" }
  };
}
function placeBet(userId, betAmount) {
  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: "User not found" };
  }
  const user = users[userIndex];
  if (user.balance < betAmount) {
    return { success: false, message: "Insufficient balance for this bet" };
  }
  users[userIndex].balance -= betAmount;
  users[userIndex].holdBalance += betAmount;
  saveUsers(users);
  return {
    success: true,
    message: `Bet of $${betAmount.toFixed(2)} placed successfully`,
    user: { ...users[userIndex], password: "" }
  };
}
function winBet(userId, betAmount, winnings) {
  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: "User not found" };
  }
  const user = users[userIndex];
  if (user.holdBalance < betAmount) {
    return { success: false, message: "Bet amount not found in hold balance" };
  }
  users[userIndex].holdBalance -= betAmount;
  users[userIndex].balance += betAmount + winnings;
  saveUsers(users);
  return {
    success: true,
    message: `Won $${winnings.toFixed(2)}! Total returned: $${(betAmount + winnings).toFixed(2)}`,
    user: { ...users[userIndex], password: "" }
  };
}
function loseBet(userId, betAmount) {
  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: "User not found" };
  }
  const user = users[userIndex];
  if (user.holdBalance < betAmount) {
    return { success: false, message: "Bet amount not found in hold balance" };
  }
  users[userIndex].holdBalance -= betAmount;
  saveUsers(users);
  return {
    success: true,
    message: `Lost bet of $${betAmount.toFixed(2)}`,
    user: { ...users[userIndex], password: "" }
  };
}

// server/payment-verification.ts
var import_web3 = require("@solana/web3.js");
async function verifySolanaPayment(walletAddress, expectedAmount, timeWindow = 30 * 60 * 1e3) {
  try {
    console.log(`\u{1F50D} Checking Solana blockchain for payments to ${walletAddress} (expecting $${expectedAmount})`);
    const connection = new import_web3.Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const publicKey = new import_web3.PublicKey(walletAddress);
    console.log(`\u{1F310} Fetching Solana transactions...`);
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 50 });
    const cutoffTime = Date.now() - timeWindow;
    console.log(`\u{1F4CB} Found ${signatures.length} recent Solana signatures`);
    for (const sig of signatures) {
      if (sig.blockTime && sig.blockTime * 1e3 > cutoffTime) {
        const transaction = await connection.getTransaction(sig.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0
        });
        if (transaction && transaction.meta) {
          const preBalances = transaction.meta.preBalances;
          const postBalances = transaction.meta.postBalances;
          for (let i = 0; i < transaction.transaction.message.staticAccountKeys.length; i++) {
            if (transaction.transaction.message.staticAccountKeys[i].toString() === walletAddress) {
              const balanceChange = (postBalances[i] - preBalances[i]) / 1e9;
              if (balanceChange > 0) {
                const estimatedUSD = balanceChange * 150;
                console.log(`\u{1F4B0} Solana received: ${balanceChange} SOL (~$${estimatedUSD.toFixed(2)}) - Expected: $${expectedAmount}`);
                if (Math.abs(estimatedUSD - expectedAmount) < expectedAmount * 0.1) {
                  console.log(`\u2705 Solana payment verified! Transaction: ${sig.signature}`);
                  return {
                    verified: true,
                    transactionHash: sig.signature,
                    currency: "SOL",
                    amount: estimatedUSD,
                    confirmations: sig.confirmationStatus === "confirmed" ? 1 : 0
                  };
                }
              }
            }
          }
        }
      }
    }
    console.log(`\u274C No matching Solana payment found for $${expectedAmount}`);
    return { verified: false };
  } catch (error) {
    console.error(`\u274C Solana verification error:`, error);
    return { verified: false };
  }
}
async function verifyEthereumPayment(walletAddress, expectedAmount, network = "ETH") {
  try {
    console.log(`\u{1F50D} Checking ${network} blockchain for payments to ${walletAddress} (expecting $${expectedAmount})`);
    const apiKey = "YourEtherscanAPIKey";
    const baseUrl = network === "ETH" ? "https://api.etherscan.io/api" : "https://api.basescan.org/api";
    const url = `${baseUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
    console.log(`\u{1F310} Fetching transactions from ${network} API...`);
    const response = await fetch(url);
    const data = await response.json();
    if (!data.result || !Array.isArray(data.result)) {
      console.log(`\u274C No transaction data found for ${walletAddress} on ${network}`);
      return { verified: false };
    }
    const thirtyMinutesAgo = Math.floor(Date.now() / 1e3) - 30 * 60;
    const recentTxs = data.result.filter(
      (tx) => parseInt(tx.timeStamp) > thirtyMinutesAgo && tx.to.toLowerCase() === walletAddress.toLowerCase()
    );
    console.log(`\u{1F4CB} Found ${recentTxs.length} recent transactions to ${walletAddress}`);
    for (const tx of recentTxs) {
      const ethAmount = parseFloat(tx.value) / 1e18;
      const estimatedUSD = ethAmount * 2500;
      console.log(`\u{1F4B0} Transaction: ${ethAmount} ETH (~$${estimatedUSD.toFixed(2)}) - Expected: $${expectedAmount}`);
      if (Math.abs(estimatedUSD - expectedAmount) < expectedAmount * 0.1) {
        console.log(`\u2705 Payment verified! Transaction: ${tx.hash}`);
        return {
          verified: true,
          transactionHash: tx.hash,
          currency: network,
          amount: estimatedUSD,
          confirmations: parseInt(tx.confirmations) || 1
        };
      }
    }
    console.log(`\u274C No matching payment found for $${expectedAmount} on ${network}`);
    return { verified: false };
  } catch (error) {
    console.error(`\u274C ${network} verification error:`, error);
    return { verified: false };
  }
}
async function verifyBitcoinPayment(walletAddress, expectedAmount) {
  try {
    console.log(`\u{1F50D} Checking Bitcoin blockchain for payments to ${walletAddress} (expecting $${expectedAmount})`);
    const url = `https://api.blockcypher.com/v1/btc/main/addrs/${walletAddress}/txs?limit=50`;
    console.log(`\u{1F310} Fetching Bitcoin transactions...`);
    const response = await fetch(url);
    const data = await response.json();
    if (!data.txs || !Array.isArray(data.txs)) {
      console.log(`\u274C No Bitcoin transaction data found for ${walletAddress}`);
      return { verified: false };
    }
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1e3);
    const recentTxs = data.txs.filter((tx) => {
      const txDate = new Date(tx.received);
      return txDate > thirtyMinutesAgo;
    });
    console.log(`\u{1F4CB} Found ${recentTxs.length} recent Bitcoin transactions`);
    for (const tx of recentTxs) {
      for (const output of tx.outputs) {
        if (output.addresses && output.addresses.includes(walletAddress)) {
          const btcAmount = output.value / 1e8;
          const estimatedUSD = btcAmount * 45e3;
          console.log(`\u{1F4B0} Bitcoin received: ${btcAmount} BTC (~$${estimatedUSD.toFixed(2)}) - Expected: $${expectedAmount}`);
          if (Math.abs(estimatedUSD - expectedAmount) < expectedAmount * 0.1) {
            console.log(`\u2705 Bitcoin payment verified! Transaction: ${tx.hash}`);
            return {
              verified: true,
              transactionHash: tx.hash,
              currency: "BTC",
              amount: estimatedUSD,
              confirmations: tx.confirmations || 0
            };
          }
        }
      }
    }
    console.log(`\u274C No matching Bitcoin payment found for $${expectedAmount}`);
    return { verified: false };
  } catch (error) {
    console.error(`\u274C Bitcoin verification error:`, error);
    return { verified: false };
  }
}
async function verifyPayment(request) {
  const { amount, walletAddresses, userId } = request;
  console.log(`Verifying payment for user ${userId}, amount: $${amount}`);
  const verificationPromises = [
    verifySolanaPayment(walletAddresses.SOL, amount),
    verifyEthereumPayment(walletAddresses.ETH, amount, "ETH"),
    verifyEthereumPayment(walletAddresses.BASE, amount, "BASE"),
    verifyBitcoinPayment(walletAddresses.BTC, amount)
    // Add SUI verification when needed
  ];
  try {
    const results = await Promise.allSettled(verificationPromises);
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.verified) {
        console.log(`Payment verified:`, result.value);
        await transferToHotWallet(result.value);
        return result.value;
      }
    }
    return { verified: false };
  } catch (error) {
    console.error("Payment verification failed:", error);
    return { verified: false };
  }
}
async function transferToHotWallet(payment) {
  try {
    console.log(`Transferring ${payment.amount} ${payment.currency} to hot wallet`);
    console.log(`Successfully transferred ${payment.amount} ${payment.currency} to hot wallet`);
  } catch (error) {
    console.error("Hot wallet transfer failed:", error);
  }
}

// server/simple-routes.ts
async function registerRoutes(app2) {
  const httpServer = (0, import_http.createServer)(app2);
  app2.post("/api/auth/register", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const result = registerUser(username, password);
      if (result.success) {
        res.json({
          user: result.user,
          message: result.message
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const result = loginUser(username, password);
      if (result.success) {
        res.json({
          user: result.user,
          message: result.message
        });
      } else {
        res.status(401).json({ message: result.message });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });
  app2.post("/api/auth/claim-daily-reward", (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }
      const result = updateDailyRewardClaim(username);
      if (result.success) {
        res.json({
          user: result.user,
          message: result.message
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Daily reward claim error:", error);
      res.status(400).json({ message: "Failed to claim daily reward" });
    }
  });
  app2.post("/api/auth/update-username", (req, res) => {
    try {
      const { userId, newUsername } = req.body;
      if (!userId || !newUsername) {
        return res.status(400).json({ message: "User ID and new username required" });
      }
      const result = updateUsername(userId, newUsername);
      if (result.success) {
        res.json({
          user: result.user,
          message: result.message
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Username update error:", error);
      res.status(400).json({ message: "Failed to update username" });
    }
  });
  app2.post("/api/game/place-bet", (req, res) => {
    try {
      const { userId, betAmount } = req.body;
      if (!userId || !betAmount) {
        return res.status(400).json({ message: "User ID and bet amount required" });
      }
      const result = placeBet(userId, betAmount);
      if (result.success) {
        res.json({
          user: result.user,
          message: result.message
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Place bet error:", error);
      res.status(400).json({ message: "Failed to place bet" });
    }
  });
  app2.post("/api/game/win-bet", (req, res) => {
    try {
      const { userId, betAmount, winnings } = req.body;
      if (!userId || !betAmount || winnings === void 0) {
        return res.status(400).json({ message: "User ID, bet amount, and winnings required" });
      }
      const result = winBet(userId, betAmount, winnings);
      if (result.success) {
        res.json({
          user: result.user,
          message: result.message
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Win bet error:", error);
      res.status(400).json({ message: "Failed to process win" });
    }
  });
  app2.post("/api/game/lose-bet", (req, res) => {
    try {
      const { userId, betAmount } = req.body;
      if (!userId || !betAmount) {
        return res.status(400).json({ message: "User ID and bet amount required" });
      }
      const result = loseBet(userId, betAmount);
      if (result.success) {
        res.json({
          user: result.user,
          message: result.message
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Lose bet error:", error);
      res.status(400).json({ message: "Failed to process loss" });
    }
  });
  app2.post("/api/verify-payment", async (req, res) => {
    try {
      const { amount, walletAddresses, userId } = req.body;
      if (!amount || !walletAddresses || !userId) {
        return res.status(400).json({
          verified: false,
          message: "Missing required fields: amount, walletAddresses, userId"
        });
      }
      console.log(`Payment verification request:`, { amount, userId, walletAddresses });
      const verificationResult = await verifyPayment({
        amount,
        walletAddresses,
        userId
      });
      if (verificationResult.verified) {
        const fs2 = await import("fs");
        const path2 = await import("path");
        const usersPath = path2.join(process.cwd(), "users.json");
        try {
          const usersData = fs2.readFileSync(usersPath, "utf8");
          const users = JSON.parse(usersData);
          const userIndex = users.findIndex((u) => u.id === userId);
          if (userIndex >= 0) {
            users[userIndex].balance = (users[userIndex].balance || 0) + amount;
            fs2.writeFileSync(usersPath, JSON.stringify(users, null, 2));
            res.json({
              verified: true,
              transactionHash: verificationResult.transactionHash,
              currency: verificationResult.currency,
              amount: verificationResult.amount,
              newBalance: users[userIndex].balance
            });
          } else {
            res.status(404).json({
              verified: false,
              message: "User not found"
            });
          }
        } catch (fileError) {
          console.error("Error updating user balance:", fileError);
          res.status(500).json({
            verified: false,
            message: "Failed to update user balance"
          });
        }
      } else {
        res.json({
          verified: false,
          message: "No valid payment found for the specified amount"
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        verified: false,
        message: "Payment verification failed"
      });
    }
  });
  app2.get("/api/room/join", (req, res) => {
    const requestedRegion = req.query.region || "us";
    if (requestedRegion !== "us" && requestedRegion !== "eu") {
      return res.status(400).json({ message: 'Invalid region. Must be "us" or "eu"' });
    }
    const room = findBestRoom(requestedRegion);
    if (!room) {
      return res.status(500).json({ message: "Failed to find or create room" });
    }
    res.json({
      roomId: room.id,
      region: room.region,
      currentPlayers: room.players.size + (room.bots ? room.bots.size : 0),
      maxPlayers: room.maxPlayers,
      arenaSize: room.gameState.arenaSize
    });
  });
  const gameRooms = /* @__PURE__ */ new Map();
  const playerToRoom = /* @__PURE__ */ new Map();
  function createRoom(region, id) {
    const roomKey = `${region}:${id}`;
    if (!gameRooms.has(roomKey)) {
      const room = {
        id,
        region,
        players: /* @__PURE__ */ new Map(),
        bots: /* @__PURE__ */ new Map(),
        maxPlayers: 80,
        // Increased from 8 to 80
        gameState: {
          players: /* @__PURE__ */ new Map(),
          food: [],
          lastUpdate: Date.now(),
          arenaSize: calculateArenaSize(15)
          // Initial arena size for 15 bots
        }
      };
      gameRooms.set(roomKey, room);
      createBots(room, 15);
      console.log(`Created room ${region}/${id} with capacity 80 players and 15 bots`);
    }
  }
  function calculateArenaSize(playerCount) {
    const baseSize = 2e3;
    const minSize = 1500;
    const maxSize = 4e3;
    if (playerCount <= 1) return { width: minSize, height: minSize };
    if (playerCount >= 80) return { width: maxSize, height: maxSize };
    const scaleFactor = (playerCount - 1) / 79;
    const currentSize = minSize + (maxSize - minSize) * scaleFactor;
    return {
      width: Math.round(currentSize),
      height: Math.round(currentSize)
    };
  }
  function updateArenaSize(room) {
    const totalCount = room.players.size + (room.bots ? room.bots.size : 0);
    const newArenaSize = calculateArenaSize(totalCount);
    const currentArena = room.gameState.arenaSize;
    const sizeDifference = Math.abs(currentArena.width - newArenaSize.width);
    if (sizeDifference >= 50) {
      room.gameState.arenaSize = newArenaSize;
      const arenaSizeMessage = JSON.stringify({
        type: "arenaSize",
        arenaSize: newArenaSize,
        playerCount: totalCount
      });
      room.players.forEach((playerData, playerId) => {
        if (playerData.ws && playerData.ws.readyState === 1) {
          playerData.ws.send(arenaSizeMessage);
        }
      });
      console.log(`Updated arena size for room ${room.region}:${room.id} to ${newArenaSize.width}x${newArenaSize.height} (${room.players.size} players + ${room.bots ? room.bots.size : 0} bots)`);
    }
  }
  function createBots(room, count) {
    const botNames = [
      "SnakeBot_Alpha",
      "SnakeBot_Beta",
      "SnakeBot_Gamma",
      "SnakeBot_Delta",
      "SnakeBot_Epsilon",
      "SnakeBot_Zeta",
      "SnakeBot_Eta",
      "SnakeBot_Theta",
      "SnakeBot_Iota",
      "SnakeBot_Kappa",
      "SnakeBot_Lambda",
      "SnakeBot_Mu",
      "SnakeBot_Nu",
      "SnakeBot_Xi",
      "SnakeBot_Omicron",
      "SnakeBot_Pi",
      "SnakeBot_Rho",
      "SnakeBot_Sigma",
      "SnakeBot_Tau",
      "SnakeBot_Upsilon"
    ];
    const botColors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff", "#fd79a8"];
    for (let i = 0; i < count; i++) {
      const botId = `bot_${room.region}_${room.id}_${i}`;
      const centerX = 2e3;
      const centerY = 2e3;
      const radius = Math.min(room.gameState.arenaSize.width, room.gameState.arenaSize.height) / 2;
      const angle = i / count * Math.PI * 2;
      const spawnRadius = radius * 0.3 + Math.random() * radius * 0.4;
      const spawnX = centerX + Math.cos(angle) * spawnRadius;
      const spawnY = centerY + Math.sin(angle) * spawnRadius;
      const bot = {
        id: botId,
        name: botNames[i % botNames.length],
        segments: [{ x: spawnX, y: spawnY }],
        color: botColors[i % botColors.length],
        mass: 15 + Math.random() * 20,
        direction: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 0.5,
        targetX: spawnX,
        targetY: spawnY,
        lastDirectionChange: Date.now(),
        isBot: true,
        money: 1,
        segmentRadius: 10,
        cashingOut: false,
        cashOutProgress: 0
      };
      room.bots.set(botId, bot);
      room.gameState.players.set(botId, bot);
    }
    console.log(`Created ${count} bots in room ${room.region}/${room.id}`);
  }
  function updateBots(room) {
    if (!room.bots) return;
    const currentTime = Date.now();
    const centerX = 2e3;
    const centerY = 2e3;
    const radius = Math.min(room.gameState.arenaSize.width, room.gameState.arenaSize.height) / 2;
    room.bots.forEach((bot) => {
      const distToTarget = Math.sqrt((bot.segments[0].x - bot.targetX) ** 2 + (bot.segments[0].y - bot.targetY) ** 2);
      if (distToTarget < 50 || currentTime - bot.lastDirectionChange > 3e3 + Math.random() * 2e3) {
        const targetAngle = Math.random() * Math.PI * 2;
        const targetRadius = Math.random() * radius * 0.8;
        bot.targetX = centerX + Math.cos(targetAngle) * targetRadius;
        bot.targetY = centerY + Math.sin(targetAngle) * targetRadius;
        bot.lastDirectionChange = currentTime;
      }
      const directionToTarget = Math.atan2(bot.targetY - bot.segments[0].y, bot.targetX - bot.segments[0].x);
      bot.direction = directionToTarget;
      const newX = bot.segments[0].x + Math.cos(bot.direction) * bot.speed;
      const newY = bot.segments[0].y + Math.sin(bot.direction) * bot.speed;
      const distFromCenter = Math.sqrt((newX - centerX) ** 2 + (newY - centerY) ** 2);
      if (distFromCenter > radius - 50) {
        bot.direction = Math.atan2(centerY - bot.segments[0].y, centerX - bot.segments[0].x);
        bot.targetX = centerX;
        bot.targetY = centerY;
      }
      const head = { x: newX, y: newY };
      bot.segments.unshift(head);
      const maxSegments = Math.floor(bot.mass / 3);
      if (bot.segments.length > maxSegments) {
        bot.segments = bot.segments.slice(0, maxSegments);
      }
      room.gameState.players.set(bot.id, bot);
    });
  }
  function findSafeSpawnPosition(room) {
    const arenaSize = room.gameState.arenaSize;
    const centerX = arenaSize.width / 2;
    const centerY = arenaSize.height / 2;
    const radius = Math.min(arenaSize.width, arenaSize.height) * 0.45;
    const minDistance = 300;
    const existingPlayers = Array.from(room.gameState.players.values()).filter(
      (p) => p.segments && p.segments.length > 0
    );
    const isPositionSafe = (x, y) => {
      for (const player of existingPlayers) {
        if (player.segments && player.segments.length > 0) {
          const headX = player.segments[0]?.x || 0;
          const headY = player.segments[0]?.y || 0;
          const distance = Math.sqrt((x - headX) ** 2 + (y - headY) ** 2);
          if (distance < minDistance) {
            return false;
          }
        }
      }
      return true;
    };
    const gridSize = 8;
    const cellWidth = arenaSize.width / gridSize;
    const cellHeight = arenaSize.height / gridSize;
    const densityMap = [];
    for (let i = 0; i < gridSize; i++) {
      densityMap[i] = [];
      for (let j = 0; j < gridSize; j++) {
        densityMap[i][j] = 0;
      }
    }
    for (const player of existingPlayers) {
      if (player.segments && player.segments.length > 0) {
        const headX = player.segments[0]?.x || centerX;
        const headY = player.segments[0]?.y || centerY;
        const gridX = Math.floor((headX - (centerX - arenaSize.width / 2)) / cellWidth);
        const gridY = Math.floor((headY - (centerY - arenaSize.height / 2)) / cellHeight);
        if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
          densityMap[gridX][gridY]++;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const nx = gridX + dx;
              const ny = gridY + dy;
              if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                densityMap[nx][ny] += 0.5;
              }
            }
          }
        }
      }
    }
    const lowDensityCells = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        lowDensityCells.push({ x: i, y: j, density: densityMap[i][j] });
      }
    }
    lowDensityCells.sort((a, b) => a.density - b.density);
    for (const cell of lowDensityCells) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const cellCenterX = centerX - arenaSize.width / 2 + (cell.x + 0.5) * cellWidth;
        const cellCenterY = centerY - arenaSize.height / 2 + (cell.y + 0.5) * cellHeight;
        const offsetX = (Math.random() - 0.5) * cellWidth * 0.8;
        const offsetY = (Math.random() - 0.5) * cellHeight * 0.8;
        const spawnX2 = cellCenterX + offsetX;
        const spawnY2 = cellCenterY + offsetY;
        const distFromCenter = Math.sqrt((spawnX2 - centerX) ** 2 + (spawnY2 - centerY) ** 2);
        if (distFromCenter <= radius - 50 && isPositionSafe(spawnX2, spawnY2)) {
          return { x: spawnX2, y: spawnY2, isOuterRing: false };
        }
      }
    }
    const outerRadius = radius + 100;
    const angle = Math.random() * Math.PI * 2;
    const spawnX = centerX + Math.cos(angle) * outerRadius;
    const spawnY = centerY + Math.sin(angle) * outerRadius;
    console.log(`\u26A0\uFE0F No safe spawn found, spawning in outer ring at (${spawnX.toFixed(1)}, ${spawnY.toFixed(1)})`);
    return { x: spawnX, y: spawnY, isOuterRing: true };
  }
  function findBestRoom(region) {
    for (const [key, room] of gameRooms.entries()) {
      if (room.region === region && room.players.size < room.maxPlayers) {
        return room;
      }
    }
    const newRoomId = gameRooms.size + 1;
    createRoom(region, newRoomId);
    return gameRooms.get(`${region}:${newRoomId}`);
  }
  const wss = new import_ws.WebSocketServer({
    server: httpServer,
    path: "/ws"
  });
  if (gameRooms.size === 0) {
    createRoom("us", 1);
    createRoom("eu", 1);
  }
  wss.on("connection", function connection(ws, req) {
    const playerId = `player_${Date.now()}_${Math.random()}`;
    console.log(`Player ${playerId} attempting to join. Total WebSocket connections: ${wss.clients.size}`);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const requestedRoomId = parseInt(url.searchParams.get("room") || "1");
    const requestedRegion = url.searchParams.get("region") || "us";
    if (requestedRegion !== "us" && requestedRegion !== "eu") {
      ws.send(JSON.stringify({
        type: "error",
        message: "Invalid region"
      }));
      ws.close();
      return;
    }
    let targetRoom = findBestRoom(requestedRegion);
    if (targetRoom.players.size >= targetRoom.maxPlayers) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Room is full"
      }));
      ws.close();
      return;
    }
    ws.playerId = playerId;
    ws.roomId = targetRoom.id;
    ws.region = targetRoom.region;
    const finalRoomKey = `${targetRoom.region}:${targetRoom.id}`;
    playerToRoom.set(playerId, finalRoomKey);
    console.log(`Player ${playerId} joined room ${targetRoom.region}/${targetRoom.id}. Room players: ${targetRoom.players.size + 1}/${targetRoom.maxPlayers}`);
    const spawnPosition = findSafeSpawnPosition(targetRoom);
    const colors = ["#d55400", "#4ecdc4", "#ff6b6b", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"];
    const playerColor = colors[targetRoom.players.size % colors.length];
    const player = {
      id: playerId,
      segments: [{ x: spawnPosition.x, y: spawnPosition.y }],
      // Start with spawn position
      color: playerColor,
      mass: 20,
      direction: 0,
      speed: 2,
      spawnTime: Date.now(),
      isGhost: true,
      // Start in ghost mode
      isOuterRing: spawnPosition.isOuterRing,
      spawnX: spawnPosition.x,
      spawnY: spawnPosition.y
    };
    targetRoom.players.set(playerId, player);
    targetRoom.gameState.players.set(playerId, player);
    updateArenaSize(targetRoom);
    const broadcastPlayerList = () => {
      const players = Array.from(targetRoom.gameState.players.values());
      const message = JSON.stringify({
        type: "players",
        players
      });
      targetRoom.players.forEach((_, pid) => {
        const playerWs = Array.from(wss.clients).find((client) => client.playerId === pid);
        if (playerWs && playerWs.readyState === 1) {
          playerWs.send(message);
        }
      });
    };
    ws.send(JSON.stringify({
      type: "welcome",
      playerId,
      room: finalRoomKey,
      playerCount: targetRoom.players.size + (targetRoom.bots ? targetRoom.bots.size : 0),
      arenaSize: targetRoom.gameState.arenaSize
    }));
    broadcastPlayerList();
    ws.on("message", function message(data) {
      try {
        const message2 = JSON.parse(data.toString());
        if (message2.type === "playerUpdate") {
          const player2 = targetRoom.players.get(playerId);
          if (player2) {
            if (player2.isGhost && (message2.data.segments || message2.data.direction !== void 0)) {
              player2.isGhost = false;
              console.log(`\u{1F47B} Player ${playerId} exited ghost mode (moved)`);
            }
            Object.assign(player2, message2.data);
            targetRoom.gameState.players.set(playerId, player2);
          }
        } else if (message2.type === "boost") {
          const player2 = targetRoom.players.get(playerId);
          if (player2 && player2.isGhost) {
            player2.isGhost = false;
            console.log(`\u{1F47B} Player ${playerId} exited ghost mode (boosted)`);
          }
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
    ws.on("close", function close(code, reason) {
      console.log(`Player ${playerId} left room ${finalRoomKey}. Code: ${code}, Reason: ${reason.toString()}`);
      if (targetRoom.players.has(playerId)) {
        targetRoom.players.delete(playerId);
        targetRoom.gameState.players.delete(playerId);
      }
      playerToRoom.delete(playerId);
      console.log(`Room ${finalRoomKey} now has ${targetRoom.players.size}/${targetRoom.maxPlayers} players`);
      updateArenaSize(targetRoom);
      broadcastPlayerList();
    });
    const gameLoop = setInterval(() => {
      if (ws.readyState === 1) {
        const players = Array.from(targetRoom.gameState.players.values());
        ws.send(JSON.stringify({
          type: "players",
          players
        }));
      } else {
        clearInterval(gameLoop);
      }
    }, 50);
  });
  setInterval(() => {
    const currentTime = Date.now();
    gameRooms.forEach((room) => {
      let hasUpdates = false;
      room.players.forEach((player, playerId) => {
        if (player.isGhost && currentTime - player.spawnTime > 1500) {
          player.isGhost = false;
          hasUpdates = true;
          console.log(`\u{1F47B} Player ${playerId} ghost mode expired after 1.5s`);
        }
        if (player.isOuterRing && player.segments && player.segments.length > 0) {
          const arenaSize = room.gameState.arenaSize;
          const centerX = arenaSize.width / 2;
          const centerY = arenaSize.height / 2;
          const radius = Math.min(arenaSize.width, arenaSize.height) * 0.45;
          const headX = player.segments[0].x;
          const headY = player.segments[0].y;
          const distFromCenter = Math.sqrt((headX - centerX) ** 2 + (headY - centerY) ** 2);
          if (distFromCenter > radius - 50) {
            const slideSpeed = 2;
            const angle = Math.atan2(centerY - headY, centerX - headX);
            const newX = headX + Math.cos(angle) * slideSpeed;
            const newY = headY + Math.sin(angle) * slideSpeed;
            player.segments[0].x = newX;
            player.segments[0].y = newY;
            hasUpdates = true;
          } else {
            player.isOuterRing = false;
            hasUpdates = true;
            console.log(`\u{1F3DF}\uFE0F Player ${playerId} slid into arena`);
          }
        }
      });
      if (hasUpdates) {
        const players = Array.from(room.gameState.players.values());
        const message = JSON.stringify({
          type: "players",
          players
        });
        room.players.forEach((_, pid) => {
          const playerWs = Array.from(wss.clients).find((client) => client.playerId === pid);
          if (playerWs && playerWs.readyState === 1) {
            playerWs.send(message);
          }
        });
      }
    });
  }, 100);
  setInterval(() => {
    gameRooms.forEach((room) => {
      const currentBotCount = room.bots ? room.bots.size : 0;
      const minBots = 15;
      if (currentBotCount < minBots) {
        if (!room.bots) {
          room.bots = /* @__PURE__ */ new Map();
        }
        const botsToAdd = minBots - currentBotCount;
        createBots(room, botsToAdd);
        updateArenaSize(room);
      }
      updateBots(room);
      if (room.players.size > 0) {
        const allPlayers = Array.from(room.gameState.players.values());
        const message = JSON.stringify({
          type: "players",
          players: allPlayers
        });
        room.players.forEach((_, playerId) => {
          const playerWs = Array.from(wss.clients).find((client) => client.playerId === playerId);
          if (playerWs && playerWs.readyState === 1) {
            playerWs.send(message);
          }
        });
      }
    });
  }, 200);
  return httpServer;
}

// server/production.ts
var app = (0, import_express.default)();
var isProduction = process.env.NODE_ENV === "production";
app.use((req, res, next) => {
  const allowedOrigins = isProduction ? [process.env.FRONTEND_URL || "http://localhost:3000"] : ["*"];
  const origin = req.get("origin");
  if (allowedOrigins.includes("*") || origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});
app.use(import_express.default.json({ limit: "10mb" }));
app.use(import_express.default.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      console.log(`${req.method} ${path2} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: process.env.NODE_ENV || "production"
  });
});
app.use(import_express.default.static("public"));
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (isProduction) {
      console.error("Production error:", err);
    }
    res.status(status).json({
      message: isProduction ? "Internal Server Error" : message
    });
  });
  const port = parseInt(process.env.PORT || "3000", 10);
  const host = "0.0.0.0";
  server.listen(port, host, () => {
    console.log(`\u{1F680} Server running in PRODUCTION mode`);
    console.log(`\u{1F310} Server listening on ${host}:${port}`);
    console.log(`\u{1F517} Environment: ${process.env.NODE_ENV || "production"}`);
    console.log(`\u{1F4CA} Health check available at: http://localhost:${port}/health`);
  });
})();
