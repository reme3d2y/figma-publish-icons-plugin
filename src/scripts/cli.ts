import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import program from 'commander';
import parseFigma from './parse-all-icons';
import parseRepo from './repo';
import copyIcons from './copy-icons';
import diffs from './diffs';

clear();
console.log(chalk.red(figlet.textSync('icons-publisher-cli', { horizontalLayout: 'full' })));

program
  .version('1.0.0')
  .option('--figma', 'Parse icons from figma')
  .option('--repo', 'Parse icons from repo folder')
  .option('--diffs', 'Search diffs between figam and repo')
  .option('--copy', 'Copy non existing icons to repo')
  .option('-o, --out-dir <type>', 'Output dir', './out')
  .parse(process.argv);

(async () => {
  const repoDir = process.env.REPO_DIR;
  const figmaId = process.env.FIGMA_ID;
  const figmaApiKey = process.env.FIGMA_API_KEY;

  if (program.figma) {
    await parseFigma(figmaId, figmaApiKey, program.outDir);
  }

  if (program.repo) {
    await parseRepo(repoDir, program.outDir);
  }

  if (program.diffs) {
    diffs(program.outDir);
  }

  if (program.copy) {
    await copyIcons(repoDir, program.outDir);
  }
})();
