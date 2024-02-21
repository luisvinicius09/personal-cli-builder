import { PressedKey } from './shared/types.ts';
import { TerminalInterface } from './TerminalInterface.ts';

function sleep(miliseconds: number) {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, miliseconds);
	});
}

const terminalInterface = new TerminalInterface();

terminalInterface.resetTerminal();

process.stdin.on('keypress', async (_, _key) => {
	const key = _key as PressedKey;

	if ((key.ctrl && key.name === 'c') || key.name === 'q') process.exit();

	if (key.name === 'a') {
		console.clear();
		process.stdin.pause();

		await terminalInterface.newActionPrompt();

		terminalInterface.resetTerminal();
	}

	if (key.name === 'r') {
		console.clear();
		process.stdin.pause();

		await terminalInterface.runLatestAction();

		terminalInterface.resetTerminal();
	}
});

process.stdin.on('error', async (err) => {
	console.log('error happened: ', err);
});
