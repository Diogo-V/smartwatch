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

content_files = {
    'words': {
        'filepath': "./words.json",
        'compress': True
    }
}
autocomplete = autocomplete_factory(content_files=content_files)


def write_dict_to_json(dict):
    with open("./words.json", "w") as fp:
        json.dump(dict, fp, indent=2)


def read_word_file():
    
    with open('./count_1w.txt', 'r') as f:
        file_name_data = f.read()
        file_words = re.findall('[a-zA-Z]+',file_name_data)
        file_freq = re.findall("[0-9]+", file_name_data)        
        
    # This is our vocabulary
    file_words = list(file_words)
    
    for i in range(0, len(file_words)):
        words[file_words[i]] = [{}, "", int(file_freq[i])]
        
    write_dict_to_json(words)


def find_suggestions(word):
    
    suggestions = autocomplete.search(word=word, size=20)
    
    print(suggestions)
    
    return suggestions


@app.route("/", methods=['GET', 'POST'])
@cross_origin()
def get_words():
    
    if request.method == 'POST':
        input_word = request.get_data().decode("utf-8")
        print(input_word)

        response = find_suggestions(input_word)
        
        return str(response).replace("[", "").replace("]", "").replace(" ", "")
    
    else:
        return ""
    

# Driver code
if __name__ == '__main__':
    app.run()