import * as fs from "fs";
export function cleanupFiles(tempDir: string, ...filePaths: string[]) {
  try {
    // Delete individual files
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${filePath}`);
      }
    }
    // Remove the temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
      console.log(`Deleted directory: ${tempDir}`);
    }
  } catch (err) {
    console.error("Error during cleanup:", err);
  }
}
