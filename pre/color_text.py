import os
import random
os.system("")
import re
import string

class ColorText:
    PLACEHOLDER_TEXT = "".join(random.choices(string.ascii_letters + string.digits, k=20))
    COLORS = {
        'd': 90,
        'r': 91,
        'g': 92,
        'y': 93,
        'b': 94,
        'm': 95,
        'c': 96,
        'w': 97,

        'D': 30,
        'R': 31,
        'G': 32,
        'Y': 33,
        'B': 34,
        'M': 35,
        'C': 36,
        'W': 37,

        '!': 1, # bold
        '?': 3, # italic
        '_': 4, # underline
        '.': 22, # no bold
        ';': 23, # no italic
        ',': 24, # no underline
    }

    def __init__(self, color_char = '$', null_char = '~', reset_char='0', escape_char = '$', additions = dict()):
        self.color_char = color_char
        self.colors = self.COLORS.copy()
        self.null_char = null_char
        self.colors.update({
            reset_char: 0,
        })
        self.colors.update(additions)
        self.escape_char = escape_char
    
    def print(self, text, end="\n", reset_on_newline = True, reset = True):
        print(self.color_text(text, reset_on_newline, reset), end=end)
    
    def color_text(self, text, end="\n", reset_on_newline = True, reset = True):
        replacements = []
        text = text.replace(self.PLACEHOLDER_TEXT, self.color_char)
        for word in text.split():
            if self.color_char in word:
                word = self.color_char + word[word.find(self.color_char) + 1:]
                replacement = self.convert_to_sequence(word)
                if '&' not in replacement:
                    replacements.append((word + ' ', replacement))
        text = text.replace(self.escape_char + self.color_char, self.PLACEHOLDER_TEXT)
        for word, sequence in replacements:
            text = re.sub(re.escape(word), sequence, text)
        if reset_on_newline:
            text = text.replace('\n', '\033[0m\n')
        return text + ('\033[0m' if reset else '')
    
    def convert_to_sequence(self, word):
        return '\033[' + ''.join(self.yielder_convert_to_sequence(word))[:-1] + 'm'

    def yielder_convert_to_sequence(self, word):
        if len(word) > 1:
            yield str(self.colors.get(word[1], '&')) + ';' \
                if word[1] != self.null_char \
                else ''
            if len(word) > 2:
                yield str(self.colors.get(word[2], '&')) + ';' \
                    if self.colors.get(word[2], 0) < 25 \
                    else str(self.colors.get(word[2]) + 10) + ';'
                if len(word) > 3:
                    yield str(self.colors.get(word[3], '&'))

if __name__ == '__main__':
    print(ColorText().color_text("""
    FULL TEST:
    $r $$r red
    $g $$g green
    $y $$y yellow
    $b $$b blue
    $m $$m magenta
    $c $$c cyan
    $w $$w white
    $d $$d black

    $R $$R dark red
    $G $$G dark green
    $Y $$Y dark yellow
    $B $$B dark blue
    $M $$M dark magenta
    $C $$C dark cyan
    $W $$W dark white
    $D $$D dark black
    $W $$W dark white

    $yR $$yR yellow text on red background
    $yG $$yG yellow text on green background
    $yY $$yY yellow text on yellow background
    $yB $$yB yellow text on blue background
    $yM $$yM yellow text on magenta background
    $yC $$yC yellow text on cyan background
    $yW $$yW yellow text on white background
    $yD $$yD yellow text on black background

    This is some $! bold text, $0 and this is some $? italic text, $; and this is some $_ underlined text$, .

    """))