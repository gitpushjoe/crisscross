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
import numpy as np
import random
import itertools
import threading

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
    empty: ClassVar[str] = '0' # character used to represent empty squares

    def __init__(self, data):
        if (len(data) ** 0.5).is_integer():
            self.size = int(len(data) ** 0.5)
            self.data = data
        else:
            raise ValueError("Crossword data is not square")

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
        return self.data[n]
    
    def at_pos(self, x, y):
        return self.at(x + y * self.size)
    
    def get_row(self, row):
        return self.data[row * self.size: (row + 1) * self.size]
    
    def get_col(self, col):
        return self.data[col::self.size]

    def get_row(self, row):
        return self.data[row * self.size: (row + 1) * self.size]
    
    # returns a list of words in a column, or a list of lists of words in each column if col is -1
    # col - column to get words from, -1 for all columns
    # level - level to check for empty squares, -1 for no check, must also set on_empty
    # on_empty - value to return if level is set and the square at x=col, y=level is empty
    def get_col_words(self, col=-1, level=-1, on_empty=None):
        level_check = False
        if 0 <= level < self.size:
            if on_empty is None:
                raise ValueError("on_empty must be set if level is set")
            else:
                level_check = True
        if 0 <= col < self.size:
            return re.findall(rf'([a-zA-Z]+)', self.get_col(col)) if not level_check or self.at_pos(col, level) != self.empty else [on_empty]
        else:
            if level_check:
                return [re.findall(rf'([a-zA-Z]+)', self.get_col(col)) if self.at_pos(col, level) != self.empty else [on_empty] for col in range(self.size)]
            else:
                return [re.findall(rf'([a-zA-Z]+)', self.get_col(col)) for col in range(self.size)]
    
    # returns a list of words in a row, or a list of lists of words in each row if row is -1
    # row - row to get words from, -1 for all rows
    # level - level to check for empty squares, -1 for no check, must also set on_empty
    # on_empty - value to return if level is set and the square at x=row, y=level is empty
    def get_row_words(self, row=-1, level=-1, on_empty=None):
        level_check = False
        if 0 <= level < self.size:
            if on_empty is None:
                raise ValueError("on_empty must be set if level is set")
            else:
                level_check = True
        if 0 <= row < self.size:
            return re.findall(rf'([a-zA-Z]+)', self.get_row(row)) if not level_check or self.at_pos(row, level) != self.empty else [on_empty]
        else:
            if level_check:
                return [re.findall(rf'([a-zA-Z]+)', self.get_row(row)) if self.at_pos(row, level) != self.empty else [on_empty] for row in range(self.size)]
            else:
                return [re.findall(rf'([a-zA-Z]+)', self.get_row(row)) for row in range(self.size)]

    # same as get_col_words but returns the last word in each column
    # col, level, on_empty - passed down to get_col_words
    def get_bottom_col_words(self, col=-1, level=-1, on_empty=None): 
        if 0 <= level < self.size and on_empty is None:
            raise ValueError("on_empty must be set if level is set")
        if 0 <= col < self.size:
            if self.get_col_words(col, level, on_empty) == []:
                return ""
            else:
                return self.get_col_words(col, level, on_empty)[-1]
        else:
            return [x[-1] if x else "" for x in self.get_col_words(-1, level, on_empty)]

    def merge(self, other):
        if self.size != other.size:
            raise ValueError("Crossword sizes do not match")
        return [self.at(i) if self.at(i) != self.empty else other.at(i) for i in range(self.size * self.size)]
    
    def get_all_words(self):
        return list(itertools.chain(*self.get_row_words(), *self.get_col_words()))
    
    def is_valid(self, dictionary):
        return all(word in dictionary for word in self.get_all_words())

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

def get_clue(lst):
    return str(lst[2]).lower()

crossword_size = 5

if not os.path.exists('clue_words.pickle'):
    clues = pd.read_table('clues.tsv', error_bad_lines=False).values.tolist()
    print(len(clues))
    clues = [c for c in clues if 3 <= len(get_clue(c)) <= crossword_size]
    print(len(clues))
    clues = [c for c in clues if False not in [l in string.ascii_lowercase for l in get_clue(c)]]
    print(len(clues))
clue_words = read_from_file('clue_words.pickle', lambda: set(get_clue(c) for c in clues))
# clue_words.update(*string.ascii_lowercase)
print(len(clue_words))
empty_padded = read_from_file('empty_padded_clue_words.pickle', lambda:None) 
# every word less than crossword_size is padded with empty squares
# so [cat, parks, star] when crossword_size is 5 becomes [cat00, 0cat0, 00cat, parks0, 0parks, star0, 0star]
if empty_padded is None:
    empty_padded = []
    for word in clue_words:
        if len(word) < crossword_size:
            temp_word = word
            while len(temp_word) <= crossword_size:
                empty_padded.append(temp_word + Crossword.empty * (crossword_size - len(temp_word)))
                temp_word = Crossword.empty + temp_word
        else:
            empty_padded.append(word)
    save_to_file(empty_padded, 'empty_padded_clue_words.pickle')

# pulls value from start_cache dictionary
# inp - string to check
# post - optional function to run on [inp, result]
# returns number of words in clue_words that start with inp, or post([inp, result]) if post is set
def get_start_cache(inp, post=None):
    if inp not in starts_with_cache:
        starts_with_cache[inp] = len([c for c in clue_words if c.startswith(inp)])
    if post:
        return post([inp, starts_with_cache[inp]])
    return starts_with_cache[inp]

starts_with_cache = dict()

def generate_crossword(base: Crossword, level=0):
    print(f'{level}',end='')
    if level == base.size: # exit condition
        return base
    if base.at_level(level) == base.empty_level():
        rand = 5000 if level == 0 else 15000 # number of words to randomly select from clue_words to test
        grab = 1500 if level == 0 else 200 # number of highest-scoring words to grab from the random selection
        grab = -grab
        
        # if level == 0:
        #     base.place_word(0, random.choice(empty_padded), inplace=True)
        #     return generate_crossword(base, 1)
        # pattern_template = []
        # for s in range(base.size):
        #     accepted_letters = []
        #     for letter in string.ascii_lowercase:
        #         base.place_letter(level * base.size + s, letter, inplace=True)
        #         word = base.get_bottom_col_words(s)
        #         if get_start_cache(word) > 0:
        #             accepted_letters.append(letter)
        #     if len(accepted_letters) == 0:
        #         accepted_letters = [base.empty]
        #     base.place_letter(level * base.size + s, base.empty, inplace=True)
        #     pattern_template.append('|'.join(accepted_letters))

        next_words = []
        # incentive is the value returned when the word just placed has an empty square in the column
        # technically, the value should be the size of next_words, since that column was just "reset"
        # however, that would result in a lot of blank spaces
        # so, it's set to 1250 so that 4- and 3-letter words can *sometimes* appear in the top column, and 1.0 otherwise to prioritize longer words
        incentive = 1250.0 if level == 0 else 1.0 
        for word in random.choices(empty_padded, k=rand):
            base.place_word(level * base.size, word, inplace=True)
            next_words.append((word,\
                                reduce( \
                                    (lambda x, y: x * y), # iterate through each column, and multiply values together to get overall score
                                    [get_start_cache( # returns the number of words in clue_words that start with the word at the bottom of the column
                                        base.get_bottom_col_words(col, level, "!"), # returns the word at the bottom of the column, or '!' if the word we just placed has an empty square in that column
                                        lambda s: incentive if s[0] == '!' else int(s[1])) 
                                    for col in range(base.size)
                                ]))
                            )
        # next_words : [(word, score), ...]

        next_words = sorted(next_words, key=lambda s: s[1])
        if next_words[grab][1] > 0: # if the lowest-scoring word out of the top <grab> words has a positive score
            base.place_word(level * base.size, random.choice(next_words[grab:])[0]) # randomly select a word from the top <grab> words
        else:
            base.place_word(level * base.size, next_words[-1][0]) # otherwise, select the highest-scoring word
        return generate_crossword(base, level + 1)
        # print(len([1 for x in hm if type(x[1]) == int]), len([1 for x in hm if type(x[1]) == float]), len([1 for x in hm if x[1] == 0]))
        # print([x for x in hm if x[1] == 0])
        # pattern = ''
        # for i in range(base.size - 2):
        #     pattern += '('
        #     temp_pattern_start = f'(({pattern_template[i]})({pattern_template[i+1]})({pattern_template[i+2]}))'
        #     temp_pattern = ''
        #     j = base.size - 1
        #     while j > i + 2:
        #         temp_pattern = f'(({pattern_template[j]}){temp_pattern})?'
        #         j -= 1
        #     temp_pattern = f'(^{temp_pattern_start}{temp_pattern}$)'
        #     pattern += temp_pattern + ')|'
        # pattern = pattern[:-1]
        # return pattern


x = Crossword('aaaaaaaaa')
# print([word in clue_words for word in x.get_all_words()])
i = 9900
while True:
    x = generate_crossword(Crossword.empty_crossword(crossword_size))
    if x.is_valid(clue_words):
        with open('crossword.txt', 'a') as f:
            i += 1
            print(f'\nCrossword #{i}: \t{x.data}')
            f.write(x.data + '\n')