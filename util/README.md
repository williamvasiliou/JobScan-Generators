# util

Input generation templates for typesetting systems, such as LaTeX.

## `keywords.c`

Template for writing keywords read from standard input to a stream. Every line read corresponds to a keyword.

Initially, the stream is standard output. Output may be redirected to a file by editing the stream in the boilerplate `main`. Alternatively, a shell may perform the redirection.

If the stream is redirected to a file, then child processes may be employed to convert the file to a suitable document format.

## `keywords.h`

Contains the underlying logic for reading and writing keywords, as required by `keywords.c`.

The strings `HEADER` and `FOOTER` must be defined before including `keywords.h`.

Additionally, there are several optional preprocessor macros available to customize the behavior of `keywords.h`:

### `KEYWORDS_IMPLEMENT_MAIN`

Include the boilerplate `main` that writes to standard output.

Output may be redirected to a file opened with `fopen`. Edit `main` to open the file. Then, supply the file as the stream for `KEYWORDS_WRITE`.

### `KEYWORDS_BEGIN(stream)`

Sequence of actions to be executed preceding the output of all keywords.

### `KEYWORDS_END(stream)`

Sequence of actions to be executed following the output of all keywords.

### `KEYWORDS_LEFT`

Prepends the string `KEYWORDS_LEFT` to each keyword in the output.

### `KEYWORDS_RIGHT`

Appends the string `KEYWORDS_RIGHT` to each keyword in the output.

### `KEYWORDS_SEPARATOR`

Use the string `KEYWORDS_SEPARATOR` to separate keywords, instead of the default `", "`.
