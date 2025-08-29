"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getUser = getUser;
exports.updateDailyRewardClaim = updateDailyRewardClaim;
exports.updateUsername = updateUsername;
exports.placeBet = placeBet;
exports.winBet = winBet;
exports.loseBet = loseBet;
// Simple file-based authentication - no database needed
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const USERS_FILE = path_1.default.join(process.cwd(), 'users.json');
// Load users from file
function loadUsers() {
    try {
        if (fs_1.default.existsSync(USERS_FILE)) {
            const data = fs_1.default.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.log('No users file found, starting fresh');
    }
    return [];
}
// Save users to file
function saveUsers(users) {
    fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
// Register new user
function registerUser(username, password) {
    const users = loadUsers();
    // Check if user exists
    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Username already exists' };
    }
    // Validate input
    if (username.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters' };
    }
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }
    // Create user
    const newUser = {
        id: Date.now().toString(),
        username,
        password, // Plain text for simplicity
        balance: 0.00, // Starting balance is $0 - users must top up
        holdBalance: 0.00 // Starting hold balance is $0
    };
    users.push(newUser);
    saveUsers(users);
    return {
        success: true,
        message: 'Account created successfully',
        user: { ...newUser, password: '' } // Don't return password
    };
}
// Login user
function loginUser(username, password) {
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return { success: false, message: 'Invalid username or password' };
    }
    return {
        success: true,
        message: 'Login successful',
        user: { ...user, password: '' } // Don't return password
    };
}
// Get user by username
function getUser(username) {
    const users = loadUsers();
    const user = users.find(u => u.username === username);
    return user ? { ...user, password: '' } : null;
}
// Update user's daily reward claim time
function updateDailyRewardClaim(username) {
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }
    const now = new Date().toISOString();
    const lastClaim = users[userIndex].lastDailyRewardClaim;
    // Check if user has already claimed today
    if (lastClaim) {
        const lastClaimDate = new Date(lastClaim);
        const nowDate = new Date(now);
        const hoursSinceLastClaim = (nowDate.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 24) {
            const hoursLeft = Math.ceil(24 - hoursSinceLastClaim);
            return {
                success: false,
                message: `Daily reward already claimed. Next claim available in ${hoursLeft} hours.`
            };
        }
    }
    // Update the last claim time and add reward
    users[userIndex].lastDailyRewardClaim = now;
    users[userIndex].balance += 0.20; // $0.10 base + $0.10 bonus
    saveUsers(users);
    return {
        success: true,
        message: 'Daily reward claimed successfully!',
        user: { ...users[userIndex], password: '' }
    };
}
// Update username
function updateUsername(userId, newUsername) {
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }
    // Validate new username
    if (newUsername.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters' };
    }
    if (newUsername.length > 20) {
        return { success: false, message: 'Username must be less than 20 characters' };
    }
    // Check if new username already exists (excluding current user)
    const existingUser = users.find(u => u.username === newUsername && u.id !== userId);
    if (existingUser) {
        return { success: false, message: 'Username already taken' };
    }
    // Update username
    users[userIndex].username = newUsername;
    saveUsers(users);
    return {
        success: true,
        message: 'Username updated successfully!',
        user: { ...users[userIndex], password: '' }
    };
}
// Place bet - move money from balance to hold balance
function placeBet(userId, betAmount) {
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }
    const user = users[userIndex];
    // Check if user has sufficient balance
    if (user.balance < betAmount) {
        return { success: false, message: 'Insufficient balance for this bet' };
    }
    // Move money from balance to hold balance
    users[userIndex].balance -= betAmount;
    users[userIndex].holdBalance += betAmount;
    saveUsers(users);
    return {
        success: true,
        message: `Bet of $${betAmount.toFixed(2)} placed successfully`,
        user: { ...users[userIndex], password: '' }
    };
}
// Win bet - move hold balance + winnings to main balance
function winBet(userId, betAmount, winnings) {
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }
    const user = users[userIndex];
    // Check if user has the bet amount in hold balance
    if (user.holdBalance < betAmount) {
        return { success: false, message: 'Bet amount not found in hold balance' };
    }
    // Move bet back to main balance + add winnings
    users[userIndex].holdBalance -= betAmount;
    users[userIndex].balance += betAmount + winnings;
    saveUsers(users);
    return {
        success: true,
        message: `Won $${winnings.toFixed(2)}! Total returned: $${(betAmount + winnings).toFixed(2)}`,
        user: { ...users[userIndex], password: '' }
    };
}
// Lose bet - remove money from hold balance (money is lost)
function loseBet(userId, betAmount) {
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }
    const user = users[userIndex];
    // Check if user has the bet amount in hold balance
    if (user.holdBalance < betAmount) {
        return { success: false, message: 'Bet amount not found in hold balance' };
    }
    // Remove bet from hold balance (money is lost)
    users[userIndex].holdBalance -= betAmount;
    saveUsers(users);
    return {
        success: true,
        message: `Lost bet of $${betAmount.toFixed(2)}`,
        user: { ...users[userIndex], password: '' }
    };
}
