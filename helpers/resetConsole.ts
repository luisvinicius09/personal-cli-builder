import printMenu from './printMenu.js';

export default function resetConsole() {
	console.clear();
	// TODO: Go back to menu

	process.stdin.resume();
	printMenu();
}
