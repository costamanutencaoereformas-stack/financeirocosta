console.log("[Vercel] Loading api/index.ts");
import { app } from "../server/index";

console.log("[Vercel] app imported, exporting for Vercel...");
export default app;
