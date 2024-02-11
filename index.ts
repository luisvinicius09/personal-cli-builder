import { emitKeypressEvents } from 'readline';
import resetConsole from './helpers/resetConsole.js';
import cli from './cli.js';
import printMenu from './helpers/printMenu.js';
import { Command } from 'commander';

type PressedKey = {
	sequence: string;
	name: string;
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
};

async function main() {
	let latestBuildId: string | null = 'null';

	const program = new Command().name('pcb').description('A simple CLI for building projects');

	console.clear();
	printMenu();

	emitKeypressEvents(process.stdin);

	if (process.stdin.isTTY) process.stdin.setRawMode(true);

	process.stdin.on('keypress', async (_, _key) => {
		const key = _key as PressedKey;

		if ((key.ctrl && key.name === 'c') || key.name === 'q') process.exit();

		console.log(key);

		if (key.name === 'm') {
			process.stdin.pause();
			// TODO: Go to menu

			console.log('got to menu');

			await new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve('foo');
				}, 2000);
			});

			resetConsole();
		}

		if (key.name === 'a') {
			console.clear();
			process.stdin.pause();

			// TODO: Run build/action
			cli().then(() => {
				resetConsole();
			});
		}

		if (key.name === 'r') {
			console.clear();
			process.stdin.pause();

			// TODO: Re run build/action
			if (latestBuildId === null) {
				console.log('No build to re-run');

				resetConsole();
				return;
			}

			console.log('building');

			resetConsole();
		}
	});
}

main();
