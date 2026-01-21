const fs = require('fs');
const path = require('path');

const promptTplDir = path.join(__dirname, 'prompt');
const getPromptTpl = (tplName) => {
  return fs.readFileSync(
    path.join(promptTplDir, `${tplName}.njk`),
    { encoding: 'utf-8' }
  );
}

exports.PromptTplMap = {
  analysis: getPromptTpl('analysis'),
  analysisSub: getPromptTpl('analysis_sub'),
  // runner: getPromptTpl('runner'),
}
