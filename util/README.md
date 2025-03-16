# util

Input generation templates for typesetting systems, such as LaTeX.

## `keywords.c`

Template for writing keywords read from standard input to a stream. Every line read corresponds to a keyword.

Initially, the stream is standard output. Output may be redirected to a file by editing the stream of `fputc` and `fputs`. Alternatively, a shell may perform the redirection.

Edit `header` and `footer` to control the output surrounding the keywords.

If the stream is a file, then child processes may be employed to convert the output to a suitable document format.
