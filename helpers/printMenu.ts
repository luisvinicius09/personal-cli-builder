import chalk from 'chalk';

export default function printMenu() {
	console.log(chalk.red('Menu!'));

	console.log(`Press ${chalk.bgBlue.white('m')} to go back to menu`);
	console.log(`Press ${chalk.bgYellow.white('a')} to run action/build`);
	console.log(`Press ${chalk.bgMagenta.white('r')} to re-run action/build`);
	console.log(`Press ${chalk.bgRed.white('q')} to quit`);
}
