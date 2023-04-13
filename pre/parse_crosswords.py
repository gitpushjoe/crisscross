from main import Crossword
from color_text import ColorText
import json
import itertools

c = ColorText()
cprint = c.print

with open('words.json', 'r') as f:
    data = json.load(f)

# Prompt the user for the input file location
filename = input('Enter the file name: ')

# Determine the max word count
max_word_count = 2000 if '2000' in filename else 0

crosswords = []
with open(filename, 'r') as f:
    crosswords = f.readlines()

num_crosswords = len(crosswords)
clues = {}
output_file = filename.replace('.txt', '.json')
banned_words_file = 'banned.txt'
banned_words = set()
with open(banned_words_file, 'r') as bwf:
    banned_words = set(bwf.read().splitlines())

for i, cw in enumerate(crosswords):
    cw = cw.strip()
    cw_obj = Crossword(cw)
    clue_dict = cw_obj.get_clues_with_directions(data, 3, max_word_count)

    # Check if any banned words are present in the crossword or clues
    banned = [[word for word in banned_words if word in ' '.join(cw_obj.get_all_words())], [word for word in banned_words if word in ' '.join(x[1] for x in itertools.chain.from_iterable(clue_dict.values())).lower()]]
    if any(banned[0]) or any(banned[1]):
        if banned[0] not in [['sss'], ['ttt'], [['sss', 'ttt']]]:
            cprint(f"$d \t Skipping {cw} because it contains $r! {banned[0]} {banned[1]}")
    else:
        clues[cw] = clue_dict

    if (i+1) % 1000 == 0:
        percent_done = (i+1) / num_crosswords * 100
        cprint(f"$G0! {percent_done:.2f}% done ({i+1}/{num_crosswords} crosswords processed)")

print(f'\n{num_crosswords} crosswords processed\n{len(clues)} crosswords with clues\n{len(clues) / num_crosswords * 100:.2f}% success rate')
# Write the output to a JSON file
with open(output_file, 'w') as f:
    json.dump(clues, f)
