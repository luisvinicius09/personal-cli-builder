import Conf from 'conf';

const configStorage = new Conf<{
	builds: {
		[key: string]: {
			projectDirectory: string;
			destinationDirectory: string;
			filesToExclude: string[];
		};
	};
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
						filesToExclude: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
					},
				},
			},
		},
	},
});

export default configStorage;