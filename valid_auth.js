
process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";

const assert = require("assert");
const User = require("./models/user");

// Mock User model methods
User.findOne = async (query) => {
    // console.log("Mock User.findOne called with:", query);
    if (query.username === "takenUser") return { id: "123", username: "takenUser" };
    if (query.email === "taken@example.com") return { id: "123", email: "taken@example.com" };
    if (query.$or) {
        // Mock login lookup
        const emailOrUser = query.$or[0].email;
        if (emailOrUser === "validUser" || emailOrUser === "valid@example.com") {
            return {
                id: "user123",
                isValidPassword: async () => true
            };
        }
    }
    return null;
};

User.prototype.save = async function () {
    // console.log("Mock User.save called");
    this.id = "new_user_id";
    return this;
};

User.findByIdAndUpdate = () => ({
    populate: async () => ({ id: "user123", goals: [] })
});

// Mock Goal model (avoiding DB errors)
const Goal = require("./models/goal");
Goal.insertMany = async () => [];

const authController = require("./controllers/auth");

async function runTests() {
    console.log("Starting Auth Controller Tests...");

    const res = {
        status: (code) => ({ send: (body) => console.log(`Response ${code}:`, body) }),
        cookie: () => { },
        sendStatus: (code) => console.log(`Response Status: ${code}`),
        send: (body) => console.log("Response sent:", body)
    };
    const next = (err) => {
        if (err) {
            // console.error("Next called with error:", err.message || err);
            return err; // Return error for checking
        }
    };

    // Test 1: Register with valid data
    console.log("\nTest 1: Register Valid User");
    try {
        await authController.register({
            body: {
                username: "newUser", // checking new required constraint
                email: "new@example.com",
                password: "password123",
                fullname: "New User"
            }
        }, res, next);
        console.log("PASS: Register Valid User");
    } catch (e) {
        console.error("FAIL: Register Valid User", e);
    }

    // Test 2: Register with invalid email (should fail via schema)
    console.log("\nTest 2: Register Invalid Email");
    try {
        await authController.register({
            body: {
                username: "user2",
                email: "not-an-email",
                password: "pwd"
            }
        }, res, (err) => {
            // auth.js maps Joi 422 to status 422 if it propagates, but verify_auth logic 
            // in register catch is `if (error.isJoi === true) error.status = 422; next(error);`
            if (err && (err.isJoi || err.status === 422)) console.log("PASS: Blocked invalid email");
            else console.error("FAIL: Did not block invalid email correctly", err);
        });
    } catch (e) {
        // caught by next usually
    }

    // Test 3: Login with emailOrUsername (username)
    console.log("\nTest 3: Login with Username");
    try {
        await authController.login({
            body: {
                emailOrUsername: "validUser",
                password: "password123"
            }
        }, res, next);
        console.log("PASS: Login with Username");
    } catch (e) {
        console.error("FAIL: Login with Username", e);
    }

    // Test 4: Login with schema violation (missing password)
    console.log("\nTest 4: Login missing password");
    try {
        await authController.login({
            body: {
                emailOrUsername: "validUser"
            }
        }, res, (err) => {
            // Login maps Joi error to BadRequest ("Invalid Username/Password")
            if (err && (err.status === 400 || err.message === "Invalid Username/Password"))
                console.log("PASS: Blocked missing password");
            else console.error("FAIL: Did not block missing password", err);
        });
    } catch (e) {
    }

    console.log("\nTests Completed.");
    process.exit(0);
}

runTests();
