import menu from './menu.js';

export default function resetConsole() {
	console.clear();
	// TODO: Go back to menu

	process.stdin.resume();
	menu();
}
