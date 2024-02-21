#! /usr/bin/env node

// src/TerminalInterface.ts
import chalk from "chalk";
import { emitKeypressEvents } from "readline";
import * as p from "@clack/prompts";
import fse from "fs-extra";

// src/configStorage.ts
import Conf from "conf";
var configStorage = new Conf({
  projectName: "personal-cli-builder",
  schema: {
    builds: {
      type: "object",
      patternProperties: {
        "^.*$": {
          type: "object",
          properties: {
            projectDirectory: {
              type: "string"
            },
            destinationDirectory: {
              type: "string"
            },
            filesToExclude: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        }
      }
    }
  }
});
var configStorage_default = configStorage;

// src/TerminalInterface.ts
function ensure(argument, message = "This value was promised to be there.") {
  if (argument === void 0 || argument === null) {
    throw new TypeError(message);
  }
  return argument;
}
var s = p.spinner();
var TerminalInterface = class {
  latestBuildId = null;
  constructor() {
  }
  renderMenu() {
    process.stdout.write(chalk.red("Menu! \n"));
    process.stdout.write(`Press ${chalk.bgYellow.white("a")} to run action/build 
`);
    process.stdout.write(
      `Press ${chalk.bgMagenta.white("r")} to re-run action/build - ${this.latestBuildId ?? null} 
`
    );
    process.stdout.write(`Press ${chalk.bgRed.white("q")} to quit 
`);
  }
  resetTerminal() {
    console.clear();
    this.renderMenu();
    emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY)
      process.stdin.setRawMode(true);
    process.stdin.resume();
  }
  async newActionPrompt() {
    let projectDirectory;
    let destinationDirectory;
    let filesToExclude = [];
    let filePathsToExclude = [];
    try {
      p.intro("personal-cli-builder");
      const usePrevDirs = await p.confirm({
        message: "Do you want to use any of saved directories?"
      });
      if (usePrevDirs) {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve("foo");
          }, 2e3);
        });
      }
      if (usePrevDirs) {
        const storedBuilds = configStorage_default.get("builds");
        const storedDirs = Object.keys(storedBuilds).map((key) => {
          return { id: key, ...storedBuilds[key] };
        });
        const chosenDirId = await p.select({
          message: "Select saved directories",
          options: storedDirs.map((directory) => {
            return {
              value: directory.id,
              label: `${directory.id}- Project Dir: ${directory.projectDirectory} | Destination Dir: ${directory.destinationDirectory}`
            };
          })
        });
        const chosenDir = ensure(storedDirs.find((dir) => dir.id === chosenDirId));
        this.latestBuildId = chosenDir.id;
        projectDirectory = chosenDir.projectDirectory;
        destinationDirectory = chosenDir.destinationDirectory;
        filesToExclude = chosenDir.filesToExclude;
        filePathsToExclude = chosenDir.filesToExclude.map(
          (file) => `${projectDirectory.charAt(projectDirectory.length - 1) === "/" ? projectDirectory : projectDirectory + "/"}${file}`
        );
      } else {
        const directory = await p.group(
          {
            projectDirectory: () => {
              return p.text({
                message: "Project directory",
                placeholder: "/home/luis/...",
                validate: (value) => {
                  if (value.length === 0) {
                    return "Path is required";
                  }
                  const doesPathExist = fse.pathExistsSync(value);
                  if (!doesPathExist) {
                    return "Path does not exist";
                  }
                  return void 0;
                }
              });
            },
            destinationDirectory: () => {
              return p.text({
                message: "Destination directory",
                placeholder: "/mnt/c/Users/Luis/...",
                validate: (value) => {
                  if (value.length === 0) {
                    return "Path is required";
                  }
                  const doesPathExist = fse.pathExistsSync(value);
                  if (!doesPathExist) {
                    return "Path does not exist";
                  }
                  return void 0;
                }
              });
            }
          },
          {
            onCancel: () => {
              p.cancel("Operation cancelled.");
              process.exit(1);
            }
          }
        );
        projectDirectory = directory.projectDirectory;
        destinationDirectory = directory.destinationDirectory;
      }
      const shouldShowExtraOptions = await p.confirm({ message: "Should show extra options?" });
      if (shouldShowExtraOptions) {
        const shouldExcludeFiles = await p.confirm({
          message: "Do you want to exclude files from the project directory?"
        });
        if (shouldExcludeFiles) {
          const projectDirList = await fse.readdir(projectDirectory);
          const excludedFiles = await p.multiselect({
            message: "Select files to exclude",
            options: projectDirList.map((file) => {
              return {
                value: file,
                label: file
              };
            })
          });
          filesToExclude = excludedFiles;
          filePathsToExclude = excludedFiles.map(
            (file) => `${projectDirectory.charAt(projectDirectory.length - 1) === "/" ? projectDirectory : projectDirectory + "/"}${file}`
          );
        }
        const shouldClearDestinationFolder = await p.confirm({
          message: "Do you want to clear the destination folder before copying files?",
          initialValue: false
        });
        if (shouldClearDestinationFolder) {
          await fse.emptyDir(destinationDirectory);
        }
      }
      if (!usePrevDirs) {
        const saveDirs = await p.confirm({
          message: "Do you want to save these directories for future use?"
        });
        if (saveDirs) {
          const buildName = await p.text({
            message: "Build name"
          });
          this.latestBuildId = buildName;
          configStorage_default.set(`builds.${buildName}`, {
            projectDirectory,
            destinationDirectory,
            filesToExclude
          });
        }
      }
      s.start("Copying files");
      if (filePathsToExclude.length > 0) {
        await fse.copy(projectDirectory, destinationDirectory, {
          filter: (src, dest) => {
            return !filePathsToExclude.includes(src);
          }
        });
      } else {
        await fse.copy(projectDirectory, destinationDirectory);
      }
      s.stop("Files copied");
      p.outro(`Done!`);
    } catch (err) {
      console.error("something wrong inside cli: ", err);
      throw err;
    }
  }
  async runActionById(actionId) {
    try {
      const storedBuilds = configStorage_default.get("builds");
      const storedDirs = Object.keys(storedBuilds).map((key) => {
        return { id: key, ...storedBuilds[key] };
      });
      const chosenDir = ensure(storedDirs.find((dir) => dir.id === actionId));
      if (chosenDir.filesToExclude.length > 0) {
        const filePathsToExclude = chosenDir.filesToExclude.map(
          (file) => `${chosenDir.projectDirectory.charAt(chosenDir.projectDirectory.length - 1) === "/" ? chosenDir.projectDirectory : chosenDir.projectDirectory + "/"}${file}`
        );
        await fse.copy(chosenDir.projectDirectory, chosenDir.destinationDirectory, {
          filter: (src, dest) => {
            return !filePathsToExclude.includes(src);
          }
        });
      } else {
        await fse.copy(chosenDir.projectDirectory, chosenDir.destinationDirectory);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  async runLatestAction() {
    if (this.latestBuildId === null)
      return;
    s.start("Running latest action...");
    await this.runActionById(this.latestBuildId);
    s.stop();
  }
};

// src/index.ts
var terminalInterface = new TerminalInterface();
terminalInterface.resetTerminal();
process.stdin.on("keypress", async (_, _key) => {
  const key = _key;
  if (key.ctrl && key.name === "c" || key.name === "q")
    process.exit();
  if (key.name === "a") {
    console.clear();
    process.stdin.pause();
    await terminalInterface.newActionPrompt();
    terminalInterface.resetTerminal();
  }
  if (key.name === "r") {
    console.clear();
    process.stdin.pause();
    await terminalInterface.runLatestAction();
    terminalInterface.resetTerminal();
  }
});
process.stdin.on("error", async (err) => {
  console.log("error happened: ", err);
});
