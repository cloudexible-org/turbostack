import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Returns the number of .env.example templates found, so the caller can fail
// loudly rather than report success after doing nothing.
function setupEnvs(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  let found = 0;

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (
        item.name === "node_modules" ||
        item.name === ".git" ||
        item.name === ".turbo" ||
        item.name === ".next" ||
        item.name === "dist"
      ) {
        continue;
      }
      found += setupEnvs(fullPath);
    } else if (item.name === ".env.example") {
      found++;
      const targetPath = path.join(dir, ".env.local");
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(fullPath, targetPath);
        console.log(
          `✅ Created .env.local from .env.example in ${path.relative(rootDir, dir) || "."}`,
        );
      } else {
        console.log(
          `⏩ .env.local already exists in ${path.relative(rootDir, dir) || "."}`,
        );
      }
    }
  }

  return found;
}

console.log("🚀 Setting up environment files...");
try {
  const found = setupEnvs(rootDir);
  if (found === 0) {
    console.error("❌ No .env.example templates found — nothing was set up.");
    process.exit(1);
  }
  console.log("✨ Setup complete!");
} catch (error) {
  console.error("❌ Error during setup:", error);
  process.exit(1);
}
