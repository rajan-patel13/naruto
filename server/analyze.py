# pip install spacy pandas vaderSentiment
# python3 -m spacy download en_core_web_sm

import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import pandas as pd
import json
import re

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("spaCy model 'en_core_web_sm' not found.")
    print("Please run: python -m spacy download en_core_web_sm")
    exit()

analyzer = SentimentIntensityAnalyzer()

def extract_aspects(doc):
    results = []
    processed_token_indices = set()

    # Iterate through all tokens to find primary patterns
    for token in doc:
        # Skip if this token has already been part of a found aspect/opinion
        if token.i in processed_token_indices:
            continue

        # PATTERN 1: Adjective modifying a noun 
        if token.dep_ == 'amod' and token.head.pos_ == 'NOUN':
            aspect = token.head
            opinion = token
            
            sentence = token.sent.text
            vs = analyzer.polarity_scores(sentence)
            sentiment = get_sentiment_label(vs['compound'])
            
            results.append({
                "aspect": aspect.text.lower(), 
                "opinion": opinion.text.lower(), 
                "context": sentence,
                "sentiment": sentiment, 
                "score": vs['compound']
            })
            processed_token_indices.add(aspect.i)
            processed_token_indices.add(opinion.i)

        # PATTERN 2: Noun as subject of a descriptive verb (e.g., "food was good")
        elif token.dep_ == 'nsubj' and token.head.pos_ in ['VERB', 'AUX']:
            aspect = token
            for child in token.head.children:
                if child.dep_ == 'acomp':
                    opinion = child
                    sentence = token.sent.text
                    vs = analyzer.polarity_scores(sentence)
                    sentiment = get_sentiment_label(vs['compound'])
                    
                    results.append({
                        "aspect": aspect.text.lower(), 
                        "opinion": opinion.text.lower(), 
                        "context": sentence,
                        "sentiment": sentiment, 
                        "score": vs['compound']
                    })
                    processed_token_indices.add(aspect.i)
                    processed_token_indices.add(opinion.i)
                    
                    # PATTERN 3: Handling conjunctions for opinions (e.g., "was good and cheap")
                    for conj in opinion.conjuncts:
                        if conj.dep_ == 'acomp':
                            conj_opinion = conj
                            results.append({
                                "aspect": aspect.text.lower(),
                                "opinion": conj_opinion.text.lower(),
                                "context": sentence,
                                "sentiment": sentiment,
                                "score": vs['compound']
                            })
                            processed_token_indices.add(conj_opinion.i)

    if not results:
        sentence_text = doc.text
        vs = analyzer.polarity_scores(sentence_text)
        
        if vs['compound'] != 0:
            sentiment = get_sentiment_label(vs['compound'])
            main_aspect = "general"
            for chunk in doc.noun_chunks:
                if chunk.root.dep_ in ('nsubj', 'dobj'):
                    main_aspect = chunk.text.lower()
                    break 
            
            results.append({
                "aspect": main_aspect, 
                "opinion": "N/A",
                "context": sentence_text,
                "sentiment": sentiment, 
                "score": vs['compound']
            })

    # Final step to remove any exact duplicates
    final_results = [dict(t) for t in {tuple(d.items()) for d in results}]
    return final_results

def get_sentiment_label(score):
    if score >= 0.05:
        return "Positive"
    elif score <= -0.05:
        return "Negative"
    else:
        return "Neutral"

def clean_text(text):
    text = re.sub(r'([.!?])([A-Za-z])', r'\1 \2', text)
    return text

def process_dataset(input_csv_path, output_csv_path, review_column_name='review', batch_size=500):
    print(f"Starting dataset processing from '{input_csv_path}'...")
    try:
        chunk_iterator = pd.read_csv(input_csv_path, chunksize=batch_size, on_bad_lines='skip')
        
        is_first_batch = True
        
        for i, chunk in enumerate(chunk_iterator):
            print(f"Processing batch {i+1}...")
            
            if review_column_name not in chunk.columns:
                print(f"Error: Column '{review_column_name}' not found.")
                return

            reviews = chunk[review_column_name].fillna('').astype(str)
            
            cleaned_reviews = [clean_text(review) for review in reviews]
            
            docs = nlp.pipe(cleaned_reviews)
            
            analysis_results = [json.dumps(extract_aspects(doc)) for doc in docs]
            
            chunk['aspect_sentiments'] = analysis_results
            
            if is_first_batch:
                chunk.to_csv(output_csv_path, index=False, mode='w')
                is_first_batch = False
            else:
                chunk.to_csv(output_csv_path, index=False, mode='a', header=False)

        print(f"Processing complete. Results saved to '{output_csv_path}'.")

    except FileNotFoundError:
        print(f"Error: The file '{input_csv_path}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# analyzes only the single input string
def process_single(review_text: str):
    if not isinstance(review_text, str) or not review_text.strip():
        print("Input must be a non-empty string.")
        return []
    
    cleaned_text = clean_text(review_text)
    doc = nlp(cleaned_text)
    
    results = extract_aspects(doc)
    
    return results