#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static const char *const header = "header\n";
static const char *const footer = "footer\n";

static uint8_t *keywords = NULL;
static uint8_t *p = NULL;
static size_t size = 0;
static size_t capacity = 128;

bool add(char c) {
	if (size < capacity) {
		keywords[size] = c;
		++size;
	} else {
		capacity *= 2;
		p = (uint8_t *) reallocarray(keywords, capacity, sizeof(uint8_t));

		if (p) {
			keywords = p;
			keywords[size] = c;
			++size;
		} else {
			return false;
		}
	}

	return true;
}

int main() {
	char c = 0;
	char *it = NULL;
	char *line = NULL;
	size_t n = 0;
	ssize_t nread = 0;
	uint16_t length = 0;

	keywords = (uint8_t *) calloc(capacity, sizeof(uint8_t));
	if (!keywords) {
		exit(EXIT_FAILURE);
	}

	while ((nread = getline(&line, &n, stdin)) != -1) {
		length = 0;
		add(0);
		add(0);

		it = line;
		while ((c = *it) != 0) {
			if (c != '\n') {
				if (!add(c) || !(++length)) {
					free(line);
					free(keywords);
					exit(EXIT_FAILURE);
				}
			}

			++it;
		}

		*(uint16_t *) (keywords + (size - length - sizeof(uint16_t))) = length;
	}
	free(line);

	fputs(header, stdout);
	if (size >= sizeof(uint16_t)) {
		nread = 0;
		length = *(uint16_t *) keywords;
		it = (char *) (keywords + sizeof(uint16_t));
		while ((uint16_t) nread < length) {
			fputc(*it, stdout);

			++it;
			++nread;
		}

		n = length + sizeof(uint16_t);
		while (n < size) {
			fputc(',', stdout);
			fputc(' ', stdout);

			nread = 0;
			length = *(uint16_t *) (keywords + n);
			it = (char *) (keywords + n + sizeof(uint16_t));
			while ((uint16_t) nread < length) {
				fputc(*it, stdout);

				++it;
				++nread;
			}

			n += length + sizeof(uint16_t);
		}

		fputc('\n', stdout);
	}
	fputs(footer, stdout);

	free(keywords);
	exit(EXIT_SUCCESS);
}
