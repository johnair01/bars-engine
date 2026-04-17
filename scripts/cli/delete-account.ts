import { deleteAccount } from "@/lib/accounts";

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error("Usage: bun run scripts/cli/delete-account.ts <username>");
    process.exit(1);
  }
  const result = await deleteAccount(name);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
