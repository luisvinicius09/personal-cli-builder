import * as p from '@clack/prompts';
import { Command } from 'commander';
import { copy, emptyDir, pathExists, pathExistsSync, readdir } from 'fs-extra';
import ora from 'ora';

async function main() {
	console.clear();

	try {
		p.intro('personal-cli-builder');

		const { projectDirectory, destinationDirectory } = await p.group(
			{
				projectDirectory: () => {
					return p.text({
						message: 'Project directory',
						placeholder: '/home/user/...',
						validate: (value) => {
							if (value.length === 0) {
								return 'Path is required';
							}

							const doesPathExist = pathExistsSync(value);

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
						placeholder: '/home/user/...',
						validate: (value) => {
							if (value.length === 0) {
								return 'Path is required';
							}

							const doesPathExist = pathExistsSync(value);

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

		const shouldShowExtraOptions = await p.confirm({ message: 'Should show extra options?' });

		if (shouldShowExtraOptions) {
			const shouldExcludeFiles = await p.confirm({
				message: 'Do you want to exclude files from the project directory?',
			});

			if (shouldExcludeFiles) {
				const projectDirList = await readdir(projectDirectory);

				const filesToExclude = await p.multiselect({
					message: 'Select files to exclude',
					options: projectDirList.map((filePath) => {
						return {
							value: filePath,
							label: filePath,
						};
					}),
				});

				// TODO: create filter to copy files
			}

			const shouldClearDestinationFolder = await p.confirm({
				message: 'Do you want to clear the destination folder before copying files?',
				initialValue: false,
			});

			if (shouldClearDestinationFolder) {
				await emptyDir(destinationDirectory);
			}
		}

		await copy(projectDirectory, destinationDirectory);

		// TODO: Improvement -> run builds before copying files

		p.outro(`Done!`);
	} catch (err) {
		console.error(err);
		throw err;
	}

	// const program = new Command();
}

main();
