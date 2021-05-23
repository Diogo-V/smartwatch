import re
from flask import Flask, request
from flask_cors import CORS, cross_origin
from fast_autocomplete import autocomplete_factory
import json


# Web server configuration
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


# AutoComplete configuration
words = {}
autocomplete = autocomplete_factory(content_files={
    'words': {
        'filepath': "./words.json",
        'compress': True
    }
})


def write_dict_to_json(dict):
    with open("./words.json", "w") as fp:
        json.dump(dict, fp, indent=2)


def read_word_file(write_to_json=False):
    
    with open('./count_1w.txt', 'r') as f:
        file_name_data = f.read()
        file_words = re.findall('[a-zA-Z]+',file_name_data)
        file_freq = re.findall("[0-9]+", file_name_data)        
        
    # This is our vocabulary
    file_words = list(file_words)
    
    for i in range(0, len(file_words)):
        words[file_words[i]] = [{}, "", int(file_freq[i])]
        
    if write_to_json: 
        write_dict_to_json(words)


def find_suggestions(word):
    
    response = []
    
    # Gets list of suggestions
    suggestions = autocomplete.search(word=word, size=100)
    
    # Appends word frequency to a dictionary
    word_and_freq = {}
    for word_list in suggestions:
        word_and_freq[word_list[0]] = words[word_list[0]][2]
        
    # Sorts dictionary by frequency
    word_and_freq = list(sorted(word_and_freq.items(), key=lambda item: item[1]))[-3:] 
    
    # Gets most likely words in a list to be returned
    for word in word_and_freq:
        response.append(word[0])
    
    return response


@app.route("/", methods=['GET', 'POST'])
@cross_origin()
def get_words():
    
    if request.method == 'POST':
        
        # Gets data sent from user
        input_word = request.get_data().decode("utf-8")
        
        # Gets list of suggestions 
        response = find_suggestions(input_word)
        
        # Parses and returns data to the client
        return str(response).replace("[", "").replace("]", "").replace(" ", "")
    
    else:
        return ""
    

# Driver code
if __name__ == '__main__':
    read_word_file()
    app.run()