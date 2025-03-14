const { accessSync, realpathSync, openSync, writeSync, closeSync } = require('node:fs');
const { basename, join } = require('node:path');
const { argv, cwd, env, exit, stdin, stdout } = require('node:process');

const targets = {
	'libreoffice/java': {
		directory: 'libreoffice/java',
		file: 'Main.java',
		compile: true,
		serve: true,
	},
	'libreoffice/python': {
		directory: 'libreoffice/python',
		file: 'Main.py',
		compile: false,
		serve: true,
	},
};

function write(path, string) {
	const fd = openSync(path, 'w');

	try {
		writeSync(fd, string);
	} finally {
		if (fd !== undefined) {
			closeSync(fd);
		}
	}
}

function searchprog(search) {
	for (const path of (env.PATH || '').split(':')) {
		const directory = path.trim();

		try {
			const file = realpathSync(join(directory, search));

			accessSync(file);
			return file;
		} catch (err) {}
	}
}

function make(target) {
	const { format, command } = require(`./${target.directory}/template.mjs`);
	write(`./${target.directory}/ResumeCommand.tsx`, command(realpathSync(join(cwd(), target.directory)), searchprog, basename, join, target.file));
}

function main(argc, argv) {
	if (argc !== 3) {
		console.log(`Usage: ${argv[1]} <TARGET>`);
	} else {
		const target = targets[argv[2]];

		if (target) {
			make(target);
			exit(0);
		} else {
			console.error(`${argv[1]}: Cannot build \`${argv[2]}': No such target`);
		}
	}

	exit(1);
}

main(argv.length, argv);
