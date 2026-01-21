
import pkg from "pg";
const { Pool } = pkg;
import * as dotenv from "dotenv";
dotenv.config();

async function checkAuthData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const client = await pool.connect();
    try {
        console.log("Checking users table...");
        const users = await client.query("SELECT id, username, role FROM users");
        console.log("Users:", JSON.stringify(users.rows, null, 2));

        console.log("\nChecking user_sessions table...");
        try {
            const sessions = await client.query("SELECT sid, expire FROM user_sessions");
            console.log("Sessions:", JSON.stringify(sessions.rows, null, 2));
        } catch (e) {
            console.log("Error checking sessions table (it might not exist yet):", e.message);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

checkAuthData();
