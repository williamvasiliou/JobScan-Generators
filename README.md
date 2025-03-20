# JobScan-Generators

Document generation extensions for [JobScan](https://github.com/williamvasiliou/JobScan).

## Get Started

Prerequisites:

- Node 20+

To set up the app, execute the following commands:

```bash
git clone https://github.com/williamvasiliou/JobScan-Generators.git
cd JobScan-Generators
npm install
```

Afterwards, select a target to build, and create `config.json`.

## Targets

Currently, the following targets are supported:

- `groff/c`
- `libreoffice/cxx`
- `libreoffice/java`
- `libreoffice/python`
- `pandoc/c`

To create `config.json`, see the `README.md` in the corresponding folder.

### `npm run build <TARGET>`

Builds the target to the corresponding folder.

Generates the target file, `ResumeCommand.tsx`, `compile.js`, and `serve.js`.

#### `ResumeCommand.tsx`

Exports the constants `COMMAND`, `ARGS`, and `OPTIONS`.

Place this file in `path/to/JobScan/src/ResumeCommand.tsx`.

JobScan invokes the command when generating a resume. The command must receive keywords from standard input. Every line read corresponds to a keyword. Afterwards, the command must write the generated file to standard output.

### `npm run compile`

Compiles the target, if applicable.

### `npm run serve`

Runs the target server, if applicable.
