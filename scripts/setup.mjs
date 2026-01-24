import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function setupEnvs(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

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
      setupEnvs(fullPath);
    } else if (item.name === ".env.example") {
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
}

console.log("🚀 Setting up environment files...");
try {
  setupEnvs(rootDir);
  console.log("✨ Setup complete!");
} catch (error) {
  console.error("❌ Error during setup:", error);
  process.exit(1);
}
