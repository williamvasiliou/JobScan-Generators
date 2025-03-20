const { accessSync, realpathSync, openSync, writeSync, closeSync, copyFileSync } = require('node:fs');
const { basename, join, relative } = require('node:path');
const { argv, cwd, env, exit } = require('node:process');

const targets = {
	'groff/c': {
		directory: 'groff/c',
		file: 'Main.c',
	},
	'libreoffice/cxx': {
		directory: 'libreoffice/cxx',
		file: 'Main.cxx',
	},
	'libreoffice/java': {
		directory: 'libreoffice/java',
		file: 'Main.java',
	},
	'libreoffice/python': {
		directory: 'libreoffice/python',
		file: 'Main.py',
	},
	'pandoc/c': {
		directory: 'pandoc/c',
		file: 'Main.c',
	},
};

function keys(config, keys) {
	if (!(config instanceof Object) || Array.isArray(config)) {
		throw new TypeError('config is not an object');
	}

	((keys) => {
		if (keys.length > 0) {
			throw new TypeError(`config: missing keys: ${keys.join(', ')}`);
		}
	})(keys.filter((key) => !(key in config)));

	((keys) => {
		if (keys.length > 0) {
			throw new TypeError(`config: extra keys: ${keys.join(', ')}`);
		}
	})(Object.keys(config).filter((key) => keys.indexOf(key) < 0));
}

function write(path, string) {
	console.log(`writing ${relative('./', path)} ...`);
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

	throw new Error(`${search}: No such file or directory`);
}

const quote = (string) => `'${String(string).trim().replaceAll('\\', '\\\\').replaceAll('\'', '\\\'')}'`;

const spawnSync = ({ COMMAND, ARGS }) =>
`const { spawnSync } = require('node:child_process');

const COMMAND = ${quote(COMMAND)};
const ARGS = [${ARGS.filter((arg) => String(arg).trim().length > 0).map(quote).join(', ')}];

console.log(COMMAND, ARGS.join(' '));
spawnSync(COMMAND, ARGS, {
	stdio: 'inherit',
});
`;

function copy(directory, files, cwd) {
	files.forEach((file) => {
		const src = join(directory, file);
		const dest = join(cwd, file);

		console.log(`copying ${relative(cwd, src)} to ${relative(cwd, dest)} ...`);
		copyFileSync(src, dest);
	});
}

function make(target) {
	const template = require(`./${target.directory}/template.mjs`);
	const { read, log, format, command } = template;

	const context = read(require, keys, {
		cwd: realpathSync(join(cwd(), target.directory)),
		file: target.file,
		searchprog,
		basename,
		join,
		string: (value) => String(value).trim(),
		uint16: (value) => (new Uint16Array([Number(value)]))[0],
		starts: (value) => Array.isArray(value) ? value.filter((start) => Array.isArray(start) && start.length > 0 && start.every((string) => typeof string === 'string' && string.trim().length > 0)) : [],
	});

	log(context);
	console.log();

	write(`./${target.directory}/${target.file}`, format(context));
	write(`./${target.directory}/ResumeCommand.tsx`, command(context));

	write(`./${target.directory}/compile.js`, 'compile' in template ? spawnSync(template.compile(context)) : `throw new Error('no compile specified');`);
	write(`./${target.directory}/serve.js`, 'serve' in template ? spawnSync(template.serve(context)) : `throw new Error('no serve specified');`);

	console.log();
	copy(target.directory, ['ResumeCommand.tsx', 'compile.js', 'serve.js'], cwd());
}

function main(argc, argv) {
	if (argc !== 3) {
		console.log(`Usage: ${basename(argv[1])} <TARGET>`);
	} else {
		const target = targets[argv[2]];

		if (target) {
			make(target);
			exit(0);
		} else {
			console.error(`${basename(argv[1])}: cannot make \`${argv[2]}': No such target`);
		}
	}

	exit(1);
}

main(argv.length, argv);
