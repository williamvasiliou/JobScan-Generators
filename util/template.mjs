import { type } from 'node:os';

export const space = (string) => string.replaceAll('\\n', '\n').replaceAll('\\t', '\t').replaceAll('\\040', ' ').replaceAll('\\134', '\\');
export const quote = (string) => `"${string.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n').replaceAll('\t', '\\t')}"`;
export const write = (starts) => starts.map((args) => `system(${quote(args.join(' '))})`).join(';\n\t\t');
export const include = (keywords, BEGIN, END, LEFT, RIGHT, SEPARATOR) => `${BEGIN ? `#define KEYWORDS_BEGIN(stream) ${BEGIN}\n` : ''}${END ? `#define KEYWORDS_END(stream) ${END}\n` : ''}${LEFT ? `#define KEYWORDS_LEFT ${quote(LEFT)}\n` : ''}${RIGHT ? `#define KEYWORDS_RIGHT ${quote(RIGHT)}\n` : ''}${SEPARATOR ? `#define KEYWORDS_SEPARATOR ${quote(SEPARATOR)}\n` : ''}#include ${quote(keywords)}`;

export const read = (prog, HEADER, FOOTER, IN, OUT) => (require, keys, context) => {
	const { cwd, searchprog, join, string, uint16, starts } = context;

	context.os = type();
	context[prog] = searchprog(prog);

	switch (context.os) {
		case 'Darwin':
			context.cc = searchprog('clang++');
			break;
		case 'Windows_NT':
			context.cc = searchprog('cl');
			break;
		default:
			context.cc = searchprog('g++');
			break;
	}

	context.cflags = '-Wall';
	context.includes = '-I.';

	context.config = require(join(cwd, 'config.json'));
	keys(context.config, ['HEADER', 'FOOTER', 'BEGIN', 'END', 'LEFT', 'RIGHT', 'SEPARATOR', 'IN', 'OUT', 'length', 'starts']);

	context.HEADER = space(string(context.config.HEADER)) || HEADER;
	context.FOOTER = space(string(context.config.FOOTER)) || FOOTER;

	context.BEGIN = string(context.config.BEGIN) || '';
	context.END = string(context.config.END) || '';

	context.LEFT = space(string(context.config.LEFT)) || '';
	context.RIGHT = space(string(context.config.RIGHT)) || '';

	context.SEPARATOR = space(string(context.config.SEPARATOR)) || '';

	context.IN = string(context.config.IN) || IN;
	context.OUT = string(context.config.OUT) || OUT;

	context.length = uint16(context.config.length);
	if (context.length <= 0) {
		throw new RangeError('config: "length" should be > 0');
	}

	context.starts = starts(context.config.starts);

	return context;
};

export const log = (prog) => (context) => ['os', prog, 'cc', 'cflags', 'includes', 'HEADER', 'FOOTER', 'BEGIN', 'END', 'LEFT', 'RIGHT', 'SEPARATOR', 'IN', 'OUT', 'length', 'starts'].forEach((key) => key === 'starts' ? context[key].forEach((start, i) => console.log(`starts[${i}] = ${start.join(' ')}`)) : console.log(((key, value) => typeof value === 'string' && value.indexOf('\n') >= 0 ? `${key} = ${quote(value)}` : `${key} = ${value}`)(key, context[key])));

export const format = (write) => ({ HEADER, FOOTER, BEGIN, END, LEFT, RIGHT, SEPARATOR, IN, OUT, length, starts }) =>
`#define HEADER ${quote(HEADER)}
#define FOOTER ${quote(FOOTER)}
${include('util/keywords.h', BEGIN, END, LEFT, RIGHT, SEPARATOR)}

#define IN ${quote(IN)}
#define OUT ${quote(OUT)}

int main() {
	FILE *stream = NULL;
	read();

	stream = fopen(IN, "w");
	if (stream) {
		write(stream);
		fclose(stream);

		${write(starts)};

		stream = fopen(OUT, "rb");
		if (stream) {
			p = (uint8_t *) calloc(${length}, sizeof(uint8_t));

			if (p) {
				while ((n = fread(p, sizeof(uint8_t), ${length}, stream)) > 0) {
					fwrite(p, sizeof(uint8_t), n, stdout);
				}

				free(p);
			}

			fclose(stream);
		}
	}

	free(keywords);
	exit(EXIT_SUCCESS);
}
`;

export const command = ({ cwd, file, basename, join }) =>
`export const COMMAND = '${join(cwd, basename(file, '.c'))}'
export const ARGS = []
export const OPTIONS = {
	cwd: '${cwd}',
}
`;

export const compile = ({ cwd, file, basename, join, cc, cflags, includes }) => ({
	COMMAND: cc,
	ARGS: cflags.split(' ').concat(includes.split(' ')).concat(['-o', join(cwd, basename(file, '.c')), join(cwd, file)]),
});
