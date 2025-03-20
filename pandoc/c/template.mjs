import * as template from '../../util/template.mjs';

const quote = (string) => template.quote(template.quote(string)).slice(1, -1);
const start = ({ pandoc, IN, OUT }) => `system("${pandoc} ${quote(IN)} -o ${quote(OUT)}")`;

export const read = template.read('pandoc', '', '', 'resume.tex', 'resume.pdf');

export const log = template.log('pandoc');

export const format = (context) => template.format((starts) => starts.length > 0 ? `${start(context)};\n\t\t${template.write(starts)}` : start(context))(context);

export const command = template.command;

export const compile = template.compile;
