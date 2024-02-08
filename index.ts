import * as p from '@clack/prompts';
import { Command } from 'commander';
import fse from 'fs-extra';
import ora from 'ora';
import Conf from 'conf';

const s = p.spinner();

function ensure<T>(
	argument: T | undefined | null,
	message: string = 'This value was promised to be there.'
): T {
	if (argument === undefined || argument === null) {
		throw new TypeError(message);
	}

	return argument;
}

const config = new Conf<{
	builds: { [key: string]: { projectDirectory: string; destinationDirectory: string } };
}>({
	projectName: 'personal-cli-builder',
	schema: {
		builds: {
			type: 'object',
			patternProperties: {
				'^.*$': {
					type: 'object',
					properties: {
						projectDirectory: {
							type: 'string',
						},
						destinationDirectory: {
							type: 'string',
						},
					},
				},
			},
		},
	},
});

async function main() {
	console.clear();

	let projectDirectory: string;
	let destinationDirectory: string;
	let filesToExclude: string[] = [];

	try {
		p.intro('personal-cli-builder');

		const shouldUsePreviousDirectories = await p.confirm({
			message: 'Should use previous directories?',
		});

		if (shouldUsePreviousDirectories) {
			const storedBuilds = config.get('builds');
			const storedDirs = Object.keys(storedBuilds).map((key) => {
				return { id: key, ...storedBuilds[key] };
			});

			const chosenDirId = await p.select({
				message: 'Select previous directories',
				options: storedDirs.map((directory) => {
					return {
						value: directory.id,
						label: `Project Dir: ${directory.projectDirectory} | Destination Dir: ${directory.destinationDirectory}`,
					};
				}),
			});

			const chosenDir = ensure(storedDirs.find((dir) => dir.id === chosenDirId));

			projectDirectory = chosenDir.projectDirectory;
			destinationDirectory = chosenDir.destinationDirectory;
		} else {
			const directory = await p.group(
				{
					projectDirectory: () => {
						return p.text({
							message: 'Project directory',
							placeholder: '/home/luis/...',
							validate: (value) => {
								if (value.length === 0) {
									return 'Path is required';
								}

								const doesPathExist = fse.pathExistsSync(value);

								if (!doesPathExist) {
									return 'Path does not exist';
								}

								return undefined;
							},
						});
					},
					destinationDirectory: () => {
						return p.text({
							message: 'Destination directory',
							placeholder: '/mnt/c/Users/Luis/...',
							validate: (value) => {
								if (value.length === 0) {
									return 'Path is required';
								}

								const doesPathExist = fse.pathExistsSync(value);

								if (!doesPathExist) {
									return 'Path does not exist';
								}

								return undefined;
							},
						});
					},
				},
				{
					onCancel: () => {
						p.cancel('Operation cancelled.');
						process.exit(1);
					},
				}
			);

			projectDirectory = directory.projectDirectory;
			destinationDirectory = directory.destinationDirectory;
		}

		if (!shouldUsePreviousDirectories) {
			const shouldSaveDirectories = await p.confirm({
				message: 'Do you want to save these directories for future use?',
			});

			if (shouldSaveDirectories) {
				const buildName = await p.text({
					message: 'Build name',
				});

				config.set(`builds.${buildName as string}`, {
					projectDirectory,
					destinationDirectory,
				});
			}
		}

		const shouldShowExtraOptions = await p.confirm({ message: 'Should show extra options?' });

		if (shouldShowExtraOptions) {
			const shouldExcludeFiles = await p.confirm({
				message: 'Do you want to exclude files from the project directory?',
			});

			if (shouldExcludeFiles) {
				const projectDirList = await fse.readdir(projectDirectory);

				const excludedFiles = await p.multiselect({
					message: 'Select files to exclude',
					options: projectDirList.map((file) => {
						return {
							value: `${
								projectDirectory.charAt(projectDirectory.length - 1) === '/'
									? projectDirectory
									: projectDirectory + '/'
							}${file}`,
							label: file,
						};
					}),
				});

				filesToExclude = excludedFiles as string[];
			}

			const shouldClearDestinationFolder = await p.confirm({
				message: 'Do you want to clear the destination folder before copying files?',
				initialValue: false,
			});

			if (shouldClearDestinationFolder) {
				await fse.emptyDir(destinationDirectory);
			}
		}

		s.start('Copying files');
		if (filesToExclude.length > 0) {
			await fse.copy(projectDirectory, destinationDirectory, {
				filter: (src, dest) => {
					return !filesToExclude.includes(src);
				},
			});
		} else {
			await fse.copy(projectDirectory, destinationDirectory);
		}
		s.stop('Files copied');

		// TODO: Improvement -> run builds before copying files

		p.outro(`Done!`);
	} catch (err) {
		console.error(err);
		throw err;
	}

	// const program = new Command();
}

main();
