import pandas as pd
import textdistance
import re
from flask import Flask, request
from flask_cors import CORS, cross_origin


app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


words = [] 


@app.route("/", methods=['GET', 'POST'])
@cross_origin()
def get_words():
    
    if request.method == 'POST':
        input_word = request.get_data().decode("utf-8")
        print(input_word)
    
    with open('./count_1w.txt', 'r') as f:
        file_name_data = f.read()
        words = re.findall('[a-zA-Z]+',file_name_data)
    
    # This is our vocabulary
    V = list(words)
    
    return str(V)[1:-1].replace(" ", "")
    

def my_autocorrect(input_word):
    input_word = input_word.lower()
 
    if input_word in V:
        return('Your word seems to be correct')
    else:
        similarities = [1-(textdistance.Jaccard(qval=2).distance(v,input_word)) for v in word_freq_dict.keys()]
        df = pd.DataFrame.from_dict(probs, orient='index').reset_index()
        df = df.rename(columns={'index':'Word', 0:'Prob'})
        df['Similarity'] = similarities
        output = df.sort_values(['Similarity', 'Prob'], ascending=False).head()
        return(output)
    

# Driver code
if __name__ == '__main__':
    app.run()