import * as template from '../../util/template.mjs';

const quote = (string) => template.quote(template.quote(string)).slice(1, -1);
const start = ({ groff, IN, OUT }) => `system("${groff} -Tpdf ${quote(IN)} > ${quote(OUT)}")`;

export const read = template.read('groff', '', '', 'resume.roff', 'resume.pdf');

export const log = template.log('groff');

export const format = (context) => template.format((starts) => starts.length > 0 ? `${start(context)};\n\t\t${template.write(starts)}` : start(context))(context);

export const command = template.command;

export const compile = template.compile;
