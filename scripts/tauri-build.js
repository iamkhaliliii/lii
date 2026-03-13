const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const apiDir = path.join(__dirname, "..", "src", "app", "api");
const apiBackup = path.join(__dirname, "..", "src", "app", "_api_backup");

// Temporarily rename API directory so static export doesn't fail
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, apiBackup);
}

try {
  execSync("npm run build", { stdio: "inherit" });
} finally {
  // Restore API directory
  if (fs.existsSync(apiBackup)) {
    fs.renameSync(apiBackup, apiDir);
  }
}
