const fs = require("fs");
const path = require("path");

function readJsonConfig(relativePath)
{
  const filePath = path.resolve(__dirname, relativePath);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const normalizedFileContent = fileContent.replace(/^\uFEFF/, "");

  return JSON.parse(normalizedFileContent);
}

module.exports =
{
  readJsonConfig
};
