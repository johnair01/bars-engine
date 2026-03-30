// scripts/run-bruised-banana-wake-up-verification.ts
// This script automates the verification steps for the Bruised Banana Residency Wake‑Up path.
// It assumes the local dev server is running (npm run dev) and that the database is seeded.

import { execSync } from "child_process";

function run(command: string) {
    console.log(`> ${command}`);
    execSync(command, { stdio: "inherit" });
}

// 1. Verify main loop readiness
run("npm run loop:ready");

// 2. Ensure residency seed data is loaded
run("npm run seed-bruised-banana-residency-milestone");

// 3. Execute the verification quest (cert‑spoke‑move‑seed‑beds‑v1) with overrides for this residency
// The verification quest can be triggered via a curl request to the API endpoint.
const campaignRef = "bruise-banana";
const spokeIndex = 0;
const url = `http://localhost:3000/api/verification/cert-spoke-move-seed-beds-v1?campaignRef=${campaignRef}&spokeIndex=${spokeIndex}`;
run(`curl -X POST "${url}"`);

console.log("Verification script completed. Check the console output for any failures.");
