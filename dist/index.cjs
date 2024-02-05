var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// index.ts
var p = __toESM(require("@clack/prompts"), 1);
var import_fs_extra = require("fs-extra");
async function main() {
  console.clear();
  try {
    p.intro("personal-cli-builder");
    const { projectDirectory, destinationDirectory } = await p.group(
      {
        projectDirectory: () => {
          return p.text({
            message: "Project directory",
            placeholder: "/home/user/...",
            validate: (value) => {
              if (value.length === 0) {
                return "Path is required";
              }
              const doesPathExist = (0, import_fs_extra.pathExistsSync)(value);
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
            placeholder: "/home/user/...",
            validate: (value) => {
              if (value.length === 0) {
                return "Path is required";
              }
              const doesPathExist = (0, import_fs_extra.pathExistsSync)(value);
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
    const shouldShowExtraOptions = await p.confirm({ message: "Should show extra options?" });
    if (shouldShowExtraOptions) {
      const shouldExcludeFiles = await p.confirm({
        message: "Do you want to exclude files from the project directory?"
      });
      if (shouldExcludeFiles) {
        const projectDirList = await (0, import_fs_extra.readdir)(projectDirectory);
        const filesToExclude = await p.multiselect({
          message: "Select files to exclude",
          options: projectDirList.map((filePath) => {
            return {
              value: filePath,
              label: filePath
            };
          })
        });
      }
      const shouldClearDestinationFolder = await p.confirm({
        message: "Do you want to clear the destination folder before copying files?"
      });
      if (shouldClearDestinationFolder) {
        await (0, import_fs_extra.emptyDir)(destinationDirectory);
      }
    }
    await (0, import_fs_extra.copy)(projectDirectory, destinationDirectory);
    p.outro(`Done!`);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
main();
