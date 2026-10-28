# Transformer Attention Intuition

Attention is like looking up a dictionary.
Query is the word I want to search.
Keys are the headwords in the dictionary.
Values are the actual text definitions.
Dot product between Query and Keys measures compatibility / similarity.
Softmax scales it into a probability distribution summing to 1.
Weighted sum of Values gives the final output context vector.
Relies on matrix multiplication and gradient descent.