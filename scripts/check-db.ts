import { db } from "../server/db";
import { accountsPayable, accountsReceivable } from "../shared/schema";

async function check() {
    console.log("Checking connection...");
    try {
        const ap = await db.select().from(accountsPayable).limit(5);
        const ar = await db.select().from(accountsReceivable).limit(5);

        console.log("SUCCESS: Connection established.");
        console.log("Accounts Payable Samples:", JSON.stringify(ap, null, 2));
        console.log("Accounts Receivable Samples:", JSON.stringify(ar, null, 2));
    } catch (err) {
        console.error("FAILURE: Could not connect to database.");
        console.error(err);
        process.exit(1);
    }
}

check();
