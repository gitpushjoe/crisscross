from functools import reduce
import time
import pandas as pd
from dataclasses import dataclass
from typing import ClassVar
import pickle
import os
import re
import string
import re
import random
import itertools
import json

@dataclass
class Clue:
    pubid: str
    year: int
    answer: str
    clue: str

    def startswith(self, prefix):
        return self.answer.startswith(prefix)

@dataclass
class Crossword:
    data: str
    size: int
    functional: bool
    empty: ClassVar[str] = '0' # character used to represent empty squares
    blank: ClassVar[str] = '?' # character used to represent blank squares

    def __init__(self, data):
        self.functional = True
        if isinstance(data, str):
            if (len(data) ** 0.5).is_integer():
                self.size = int(len(data) ** 0.5)
                self.data = data
            else:
                raise ValueError("Crossword data is not square")
        elif isinstance(data, int):
            self.size = data
            self.data = self.empty * data * data
        elif data is None:
            self.functional = False
            self.size = 0
            self.data = ""

    @classmethod
    def empty_crossword(cls, size):
        return Crossword(Crossword.empty * size * size)

    def is_empty(self):
        return self.data == self.empty * self.size * self.size

    def place_letter(self, square, letter, inplace=False):
        if not inplace:
            return Crossword(self.data[:square] + letter + self.data[square + 1:], self.size)
        else:
            self.data = self.data[:square] + letter + self.data[square + 1:]
            return self
    
    def place_word(self, square, word, inplace=True):
        if not inplace:
            return Crossword(self.data[:square] + word + self.data[square + len(word):], self.size)
        else:
            self.data = self.data[:square] + word + self.data[square + len(word):]
            return self

    def at_level(self, level):
        return "".join(self.data[level * self.size: (level + 1) * self.size])

    def empty_level(self):
        return self.empty * self.size
    
    def at(self, n):
        return self.data[n] if n < len(self.data) else None
    
    def at_pos(self, x, y):
        return self.at(x + y * self.size)
    
    def get_row(self, row):
        return self.data[row * self.size: (row + 1) * self.size]
    
    def get_col(self, col):
        return self.data[col::self.size]

    def get_row(self, row):
        return self.data[row * self.size: (row + 1) * self.size]
    
    def set(self, n, char):
        self.data = self.data[:n] + char + self.data[n + 1:]
    
    def print(self):
        for i in range(self.size):
            print(self.at_level(i))

    # returns a list of words in a column, or a list of lists of words in each column if col is -1
    # col - column to get words from, -1 for all columns
    # row - row to start from, 0 for top
    def get_col_words(self, col=-1, row=0):
        # print(self.get_col(col)[row:].split(self.empty))
        if 0 <= col < self.size:
            return [w for w in self.get_col(col)[row:].split(self.empty) if w]
        else:
            return [[w for w in self.get_col(c)[row:].split(self.empty) if w] for c in range(self.size)]
    
    # returns a list of words in a row, or a list of lists of words in each row if row is -1
    # row - row to get words from, -1 for all rows
    # col - column to start from, 0 for left
    def get_row_words(self, row=-1, col=0):
        if 0 <= row < self.size:
            return [w for w in self.get_row(row)[col:].split(self.empty) if w]
        else:
            return [[w for w in self.get_row(r)[col:].split(self.empty) if w] for r in range(self.size)]

    def get_curr_col_word(self, col, row=0):
        # print([word for word in self.get_col_words(col, row) if self.blank in word])
        curr = [word for word in self.get_col_words(col, row) if self.blank in word]
        return curr[0] if curr else None
    
    def get_curr_row_word(self, row, col=0):
        return [word for word in self.get_row_words(row, col) if self.blank in word][0]

    def merge(self, other):
        if self.size != other.size:
            raise ValueError("Crossword sizes do not match")
        return [self.at(i) if self.at(i) != self.empty else other.at(i) for i in range(self.size * self.size)]
    
    def get_all_words(self):
        return list(itertools.chain(*self.get_row_words(), *self.get_col_words()))
    
    def is_valid(self, dictionary):
        return False if not self.functional else all(word in dictionary for word in self.get_all_words())

@dataclass
class CrosswordReference(Crossword):
    data: str
    size: int

def save_to_file(data, file_name):
    with open(file_name, 'wb') as f:
        pickle.dump(data, f)

def read_from_file(file_name, load_function=None):
    if not os.path.exists(file_name):
        if load_function:
            data = load_function()
            save_to_file(data, file_name)
            return data
        else:
            raise ValueError(f"File {file_name} does not exist")
    with open(file_name, 'rb') as f:
        data = pickle.load(f)
    return data

def get_word(lst):
    return str(lst[2]).lower()

crossword_size = 7

if not os.path.exists('clue_words.pickle'):
    clues = pd.read_table('clues.tsv', error_bad_lines=False).values.tolist()
    print(len(clues))
    clues = [c for c in clues if 3 <= len(get_word(c)) <= crossword_size]
    print(len(clues))
    clues = [c for c in clues if False not in [l in string.ascii_lowercase for l in get_word(c)]]
    print(len(clues))
words = read_from_file('clue_words.pickle', lambda: set(get_word(c) for c in clues))
# clue_words.update(*string.ascii_lowercase)
# empty_padded = read_from_file('empty_padded_clue_words.pickle', lambda:None) 
# # every word less than crossword_size is padded with empty squares
# # so [cat, parks, star] when crossword_size is 5 becomes [cat00, 0cat0, 00cat, parks0, 0parks, star0, 0star]
# if empty_padded is None:
#     empty_padded = []
#     for word in words:
#         if len(word) < crossword_size:
#             temp_word = word
#             while len(temp_word) <= crossword_size:
#                 empty_padded.append(temp_word + Crossword.empty * (crossword_size - len(temp_word)))
#                 temp_word = Crossword.empty + temp_word
#         else:
#             empty_padded.append(word)
#     save_to_file(empty_padded, 'empty_padded_clue_words.pickle')

def starts_with_count(inp, blank):
    start = inp[:inp.index(blank)]
    if inp not in starts_with_cache:
        starts_with_cache[inp] = len([c for c in word_length_map[len(inp)] if c.startswith(start)])
    return starts_with_cache[inp]

starts_with_cache = dict()
words.update(*string.ascii_lowercase)
word_length_map = {i: [c for c in words if len(c) == i] for i in range(3, crossword_size + 1)}
word_length_map.update({1: list(string.ascii_lowercase)})

def generate_crossword(base: Crossword, level=0, dictionary=words):
    # print(f'{level}',end='')
    # base.print()
    # print()
    if level == base.size: # exit condition
        return base
    if '?' not in base.at_level(level): # if the row is already filled, skip it
        return generate_crossword(base, level + 1)
    if base.size == 7:
        rand = 200 if level == 0 else 1600 # number of words to randomly select from clue_words to test
        grab = 10 if level == 0 else 800 # number of highest-scoring words to grab from the random selection
        grab = -grab
    elif base.size == 5:
        rand = 1 if level == 0 else 1600
        grab = 1 if level == 0 else 800
        grab = -grab
    
    next_words = []
    template_word = base.at_level(level)
    template_start = template_word.index('?') if '?' in template_word else 0
    template_word = template_word[template_start:]
    if '?' not in template_word:
        return base
    template_word = [x for x in template_word.split(base.empty) if x][0] if base.empty in template_word else template_word
    for word in random.choices(word_length_map[len(template_word)], k=rand):
        base.place_word(level * base.size + template_start, word, inplace=True)
        if level != base.size - 1:
            next_words.append((word,\
                                reduce( \
                                    (lambda x, y: x * y), # iterate through each column, and multiply values together to get overall score
                                    [1] + [starts_with_count( # returns the number of words in clue_words that start with the words in the column
                                        base.get_curr_col_word(col), # get the word in the column (e.g. 'tra??')
                                        base.blank # get the blank character ('?')
                                    ) 
                                    for col in range(base.size) \
                                        if (base.at_pos(col, level + 1) == base.blank \
                                        and base.at_pos(col, level) != base.empty) \
                                ]))
                            )
        elif base.is_valid(words):
            return base
    if level == base.size - 1:
        return Crossword(None)
    next_words = sorted(next_words, key=lambda s: s[1])
    grab = max(grab, -len(next_words))
    if next_words[grab][1] > 0: # if the lowest-scoring word out of the top <grab> words has a positive score
        base.place_word(level * base.size + template_start, random.choice(next_words[grab:])[0]) # randomly select a word from the top <grab> words
    else:
        if next_words[-1][1] == 0:
            return Crossword(None)
        base.place_word(level * base.size + template_start, next_words[-1][0]) # otherwise, select the highest-scoring word
    if '?' in base.at_level(level):
        return generate_crossword(base, level)
    return generate_crossword(base, level + 1)

filename = input('Enter src: ')
with open(filename, 'r') as f:
    templates = json.load(f)
if 'success' in filename:
    thresh = 0.1
    templates = [c for [c, v] in templates.items() if v[0] >= thresh]
print(templates, len(templates))
dest = input('Enter dest: ')
time.sleep(3)

if __name__ == '__main__':
    i = len(list(open(dest, 'r')))
    attempts = 0
    start = int(time.time() * 100)
    # templates = {t: [0, 0] for t in templates}
    while True:
        attempts += 1
        t = random.choice(list(templates))
        x = generate_crossword(Crossword(t))
        # templates[t][1] += 1
        if x.is_valid(words):
            # templates[t][0] += 1
            save = start
            start = int(time.time() * 100)
            print(f'\n{{attempts = {attempts}}} ({(start - save) / 100:.2}s elapsed, avg: {int((start - save) / attempts)}ms)')
            with open(dest, 'a') as f:
                i += 1
                print(f'Crossword #{i:,}:')
                [print(f'\t\t{x.data[i*x.size:(i+1)*x.size]}') for i in range(x.size)]
                f.write(x.data + '\n')
            attempts = 0
            # with open('templates\medium_success_rate.json', 'w') as f:
            #     json.dump({i: [v[0] / max(v[1], 1), v[1]] for i, v in templates.items()}, f)
                
    # best params start at 20,594