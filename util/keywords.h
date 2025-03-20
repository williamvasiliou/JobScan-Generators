#ifndef KEYWORDS_H
#define KEYWORDS_H
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static uint8_t *keywords = NULL;
static uint8_t *p = NULL;
static size_t size = 0;
static size_t capacity = 128;

static char c = 0;
static char *it = NULL;
static char *line = NULL;
static size_t n = 0;
static ssize_t nread = 0;
static uint16_t length = 0;

static bool add(char c) {
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

#define KEYWORDS_READ(stream)							\
	keywords = (uint8_t *) calloc(capacity, sizeof(uint8_t));		\
	if (!keywords) {							\
		exit(EXIT_FAILURE);						\
	}									\
										\
	while ((nread = getline(&line, &n, stream)) != -1) {			\
		length = 0;							\
		add(0);								\
		add(0);								\
										\
		it = line;							\
		while ((c = *it) != 0) {					\
			if (c != '\n') {					\
				if (!add(c) || !(++length)) {			\
					free(line);				\
					free(keywords);				\
					exit(EXIT_FAILURE);			\
				}						\
			}							\
										\
			++it;							\
		}								\
										\
		*(uint16_t *) (keywords + (size - length - sizeof(uint16_t))) =	\
		length;								\
	}									\
	free(line)

#ifdef KEYWORDS_BEGIN
#define KEYWORDS_WRITE_BEGIN(stream) KEYWORDS_BEGIN(stream)
#else
#define KEYWORDS_WRITE_BEGIN(stream)
#endif // KEYWORDS_BEGIN

#ifdef KEYWORDS_END
#define KEYWORDS_WRITE_END(stream) KEYWORDS_END(stream)
#else
#define KEYWORDS_WRITE_END(stream) fputc('\n', stream)
#endif // KEYWORDS_END

#ifdef KEYWORDS_LEFT
#define KEYWORDS_WRITE_LEFT(stream) fputs(KEYWORDS_LEFT, stream)
#else
#define KEYWORDS_WRITE_LEFT(stream)
#endif // KEYWORDS_LEFT

#ifdef KEYWORDS_RIGHT
#define KEYWORDS_WRITE_RIGHT(stream) fputs(KEYWORDS_RIGHT, stream)
#else
#define KEYWORDS_WRITE_RIGHT(stream)
#endif // KEYWORDS_RIGHT

#ifdef KEYWORDS_SEPARATOR
#define KEYWORDS_WRITE_SEPARATOR(stream) fputs(KEYWORDS_SEPARATOR, stream)
#else
#define KEYWORDS_WRITE_SEPARATOR(stream)					\
	fputc(',', stream);							\
	fputc(' ', stream)
#endif // KEYWORDS_SEPARATOR

#define KEYWORDS_WRITE(stream)							\
	fputs(HEADER, stream);							\
	if (size >= sizeof(uint16_t)) {						\
		KEYWORDS_WRITE_BEGIN(stream);					\
										\
		KEYWORDS_WRITE_LEFT(stream);					\
		nread = 0;							\
		length = *(uint16_t *) keywords;				\
		it = (char *) (keywords + sizeof(uint16_t));			\
		while ((uint16_t) nread < length) {				\
			fputc(*it, stream);					\
										\
			++it;							\
			++nread;						\
		}								\
		KEYWORDS_WRITE_RIGHT(stream);					\
										\
		n = length + sizeof(uint16_t);					\
		while (n < size) {						\
			KEYWORDS_WRITE_SEPARATOR(stream);			\
										\
			KEYWORDS_WRITE_LEFT(stream);				\
			nread = 0;						\
			length = *(uint16_t *) (keywords + n);			\
			it = (char *) (keywords + n + sizeof(uint16_t));	\
			while ((uint16_t) nread < length) {			\
				fputc(*it, stream);				\
										\
				++it;						\
				++nread;					\
			}							\
			KEYWORDS_WRITE_RIGHT(stream);				\
										\
			n += length + sizeof(uint16_t);				\
		}								\
										\
		KEYWORDS_WRITE_END(stream);					\
	}									\
	fputs(FOOTER, stream)

#ifdef KEYWORDS_IMPLEMENT_MAIN
int main() {
	KEYWORDS_READ(stdin);
	KEYWORDS_WRITE(stdout);

	free(keywords);
	exit(EXIT_SUCCESS);
}
#else
static void read() {
	if (keywords) {
		free(keywords);
		size = 0;
		capacity = 128;
	}

	line = NULL;
	n = 0;
	KEYWORDS_READ(stdin);
}

static void write(FILE *const stream) {
	KEYWORDS_WRITE(stream);
}
#endif // KEYWORDS_IMPLEMENT_MAIN
#endif // KEYWORDS_H
