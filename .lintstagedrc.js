const { ESLint } = require('eslint');

const removeIgnoredLintFiles = async (files) => {
  const eslint = new ESLint();
  const isIgnored = await Promise.all(files.map((file) => eslint.isPathIgnored(file)));
  return files.filter((_, i) => !isIgnored[i]).join(' ');
};

const eslint = 'eslint --fix --max-warnings=0';
const prettier = 'prettier --ignore-unknown --no-error-on-unmatched-pattern --write';
const cspell = 'cspell --no-progress --no-must-find-files';

module.exports = {
  '**/*.{js,jsx,ts,tsx}': async (files) => {
    const allFiles = files.join(' ');

    const filesToLint = await removeIgnoredLintFiles(files);
    const esLintActions = filesToLint ? [`${eslint} ${filesToLint}`] : [];

    return [
      ...esLintActions,
      // `stylelint --config ./stylelint.styled.js ${allFiles}`,
      `${cspell} ${allFiles}`,
      `${prettier} ${allFiles}`,
    ];
  },

  '**/*.{scss,sass,css,less}': [
    // 'stylelint fix --config ./stylelint.scss.js',
    prettier,
  ],

  '**/*.!(js|jsx|ts|tsx|scss|sass|css|less)': [cspell, prettier],
};
