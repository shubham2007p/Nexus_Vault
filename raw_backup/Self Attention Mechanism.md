# Self Attention Mechanism

Self-attention connects different positions of a single sequence to compute a representation of the sequence.

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

Fundamental building block of [[Transformer Architecture]].