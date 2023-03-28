from main import Crossword
from color_text import ColorText
import string
import json

ct = ColorText()
cprint = ct.print


def print_crossword(crossword: Crossword, textFrom: Crossword):
    for r in range(crossword.size):
        # cprint(''.join([f'$~g {l} ' if l != crossword.empty else f'$~r {l} ' for l in crossword.get_row(r) ])[:-1])
        cprint(''.join([f'$Dg {c2} ' if c1 != crossword.empty else f'$dd {c2} ' for (c1, c2) in zip(crossword.get_row(r), textFrom.get_row(r))])[:-1])

valid_templates = set()

if __name__ == '__main__':
    cprint('$Y Reset/Create file: ', end='')
    file = input('')
    cprint('$Y Crossword size: ', end='')
    size = int(input(''))

    chars = string.ascii_letters + '123456789' + '~[]\;./*-+`!@#%^&()|'
    chars = chars[:size ** 2]
    reference = Crossword(chars)
    inp = ""
    dictionary = ['a' * n for n in range(3, int(len(chars) ** 0.5 + 1))] + ['a']
    curr = Crossword('a' * len(chars))
    last_crossword = curr.data
    while True:
        if inp == "" and curr.is_valid(dictionary):
            valid_templates.add(curr.data)
            last_crossword = curr.data
            valid_templates.add(''.join([curr.get_row(r)[::-1] for r in range(curr.size)]))
            valid_templates.add(''.join([curr.data[i:i+curr.size] for i in range(curr.size**2 - curr.size, -1, -curr.size)]))
            curr.data  = ''.join([curr.data[i::curr.size][::-1] for i in range(curr.size)])
            valid_templates.add(curr.data)
            curr.data  = ''.join([curr.data[i::curr.size][::-1] for i in range(curr.size)])
            valid_templates.add(curr.data)
            curr.data  = ''.join([curr.data[i::curr.size][::-1] for i in range(curr.size)])
            valid_templates.add(curr.data)
            with open(file, 'w') as f:
                f.write(json.dumps(list(valid_templates)))
            curr = Crossword('a' * len(chars))
        print('\n' * 100)
        cprint(f'$Y! $? {len(valid_templates)} $Y. valid templates')
        print_crossword(curr, reference)
        
        cprint('$g Valid' if curr.is_valid(dictionary) else '$r Invalid', end="")
        inp = input(' >>> ')
        if ',' in inp:
            curr.data = last_crossword
        for char in inp:
            idx = reference.data.find(char)
            if idx != -1:
                curr.set(idx, curr.empty if curr.data[idx] != curr.empty else 'a')