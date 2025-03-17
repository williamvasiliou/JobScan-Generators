# util

Input generation templates for typesetting systems, such as LaTeX.

## `keywords.c`

Template for writing keywords read from standard input to a stream. Every line read corresponds to a keyword.

Initially, the stream is standard output. Output may be redirected to a file by editing the stream of `fputc` and `fputs`. Alternatively, a shell may perform the redirection.

Edit `HEADER` and `FOOTER` to control the surrounding output.

If the stream is redirected to a file, then child processes may be employed to convert the file to a suitable document format.

## `keywords.h`

Defines the underlying logic for `keywords.c`.

Define the preprocessor macro `KEYWORDS_IMPLEMENT_MAIN` for the boilerplate `main` to be implemented.

Additionally, the strings `HEADER` and `FOOTER` must be defined before including `keywords.h`.
