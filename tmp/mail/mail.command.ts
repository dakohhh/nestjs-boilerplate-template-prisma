import * as fs from "fs";
import * as path from "path";
import { Command } from "nestjs-command";
import { render } from "@react-email/render";
import { Injectable } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

@Injectable()
export class MailCommand {
  @Command({
    command: "compile:emails",
    describe: "Compile React Email templates to HTML",
  })
  async compileEmails() {
    // Default to v1 for now - can be made configurable later
    const version = "v1";

    console.log("Compiling emails for version", version);
    const templatesDir = path.resolve(process.cwd(), `src/mail/templates/${version}`);
    const outputDir = path.resolve(process.cwd(), `src/mail/templates/html/${version}`);
    const tempJsDir = path.resolve(process.cwd(), `temp/mail/templates/${version}`);

    if (!fs.existsSync(templatesDir)) {
      console.error(`❌ Template folder for version "${version}" does not exist.`);
      process.exit(1);
    }

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });
    // Create temp directory for compiled JS
    fs.mkdirSync(tempJsDir, { recursive: true });

    console.log("🔄 Compiling TypeScript templates to JavaScript...");

    try {
      // Compile TypeScript to JavaScript in temp directory
      await execAsync(`npx tsc ${templatesDir}/*.tsx --outDir ${tempJsDir} --target ES2020 --module CommonJS --moduleResolution node --jsx react --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck`);
    } catch (error) {
      console.error("❌ TypeScript compilation failed:", error.message);
      process.exit(1);
    }

    const files = fs.readdirSync(tempJsDir).filter((file) => file.endsWith(".js"));

    for (const file of files) {
      const filePath = path.join(tempJsDir, file);

      try {
        // Clear require cache to ensure fresh imports
        delete require.cache[require.resolve(filePath)];

        // Use require for CommonJS modules
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const componentModule = require(filePath);

        // Get the first exported component (assuming it's the main component)
        const componentName = Object.keys(componentModule).find((key) => key !== "default" && typeof componentModule[key] === "function");

        if (!componentName) {
          console.error(`❌ No valid React component found in ${file}`);
          continue;
        }

        const Component = componentModule[componentName];

        // Define placeholder props for each template
        const getPlaceholderProps = (fileName: string) => {
          const baseName = fileName.replace(/\.js$/, "");
          switch (baseName) {
            case "verificationOtp":
              return { otp: "{{otp}}" };
            case "passwordResetOtp":
              return { otp: "{{otp}}" };
            case "welcome":
              return { name: "{{name}}" };
            case "projectInvite":
              return {
                name: "{{name}}",
                title: "{{title}}",
                client: "{{client}}",
                duration: "{{duration}}",
                totalBudget: "{{totalBudget}}",
              };
            case "base":
              return { previewText: "{{previewText}}", children: "{{children}}" };
            default:
              return {};
          }
        };

        // Render the React Email component to HTML with placeholder data
        const placeholderProps = getPlaceholderProps(file);
        const html = await render(Component(placeholderProps));

        const outputFileName = file.replace(/\.js$/, ".html");
        const outputPath = path.join(outputDir, outputFileName);

        fs.writeFileSync(outputPath, html);
        console.log(`✅ Compiled ${file} -> ${outputPath}`);
      } catch (error) {
        console.error(`❌ Error compiling ${file}:`, error.message);
      }
    }

    // Clean up temp directory
    fs.rmSync(path.resolve(process.cwd(), "temp"), { recursive: true, force: true });

    console.log(`\n🎉 Email templates compiled successfully for version "${version}"`);
  }
}
