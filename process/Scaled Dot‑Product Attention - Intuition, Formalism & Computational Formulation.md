> [!ABSTRACT] Formal Academic Synthesis
> 📝 **Original Raw Notes:** [[Attention Intuition Raw]]
> ⚡ **Generated via Groq LPU** (openai/gpt-oss-120b • Prompt `v1.2.0-academic-rigor` • Oct 22, 2026)

# Scaled Dot‑Product Attention: Intuition, Formalism & Computational Formulation

Attention computes a weighted combination of value vectors where weights reflect the similarity between a query and a set of keys, enabling dynamic context‑dependent representations in Transformers.

## 🧠 Intuition & Conceptual Model

The raw note likens attention to looking up a dictionary: the query is the word you search for, keys are the headwords, and values are the definitions. The dot‑product measures how well the query matches each headword, softmax turns these scores into a probability distribution, and the weighted sum of definitions yields the contextual meaning—mirroring how a model dynamically pulls relevant information from a set of vectors.

## 📚 Formal Definitions & Foundations

### Query (Q)
A vector representation of the element for which we seek contextual information.

$$null$$

### Key (K)
Vector representations of all candidate elements that may provide relevant information.

$$null$$

### Value (V)
Vector representations containing the actual information to be aggregated.

$$null$$

### Attention Score
Raw compatibility between a query and each key, computed via dot‑product.

$$$s_i = qcdot k_i$$$

### Scaled Dot‑Product
Dot‑product divided by the square‑root of the key dimension to control variance.

$$$hat{s}_i = rac{qcdot k_i}{sqrt{d_k}}$$$

### Softmax
A smooth, differentiable function that converts scores into a probability distribution.

$$$alpha_i = rac{e^{hat{s}_i}}{sum_j e^{hat{s}_j}}$$$

### Context Vector (C)
Weighted sum of value vectors using the attention probabilities.

$$$C = sum_i alpha_i v_i$$$

## 📐 Mathematical Formulation & Step-by-Step Derivations

### Derivation of Scaled Dot‑Product Attention
**Premise / Objective:** Given matrices Q in mathbb{R}^{n	imes d_k}, K in mathbb{R}^{m	imes d_k}, V in mathbb{R}^{m	imes d_v}, compute the attention output for each query.

**Step-by-Step Derivation:**
1. 1. Compute raw scores matrix $S = QK^{	op}$ where $S_{ij}=q_icdot k_j$.
2. 2. Scale scores to mitigate large variance: $hat{S}=rac{S}{sqrt{d_k}}$.
3. 3. Apply softmax row‑wise to obtain attention weights: $A = 	ext{softmax}(hat{S})$, i.e. $A_{ij}=rac{e^{hat{S}_{ij}}}{sum_{l}e^{hat{S}_{il}}}$.
4. 4. Multiply the weights by the value matrix to obtain the context: $C = AV$, yielding $C_i = sum_j A_{ij} v_j$.

> **Conclusion:** The final output $C$ is a differentiable function of Q, K, V and can be trained end‑to‑end via gradient descent.

## ⚖️ Core Theorems & Principles

- **Softmax Gradient Property**: The gradient of the softmax output $alpha_i$ w.r.t. its input $hat{s}_j$ is $rac{partial alpha_i}{partial hat{s}_j}=alpha_i(delta_{ij}-alpha_j)$.
  - *Implication:* Enables efficient back‑propagation through the attention weights without explicit enumeration of all pairwise derivatives.
- **Variance‑Stabilizing Scaling**: Dividing the dot‑product by $sqrt{d_k}$ keeps the variance of $hat{s}_i$ approximately constant as $d_k$ grows.
  - *Implication:* Prevents the softmax from entering regions of extreme saturation, improving numerical stability and training speed.

## 💡 Key Takeaways & Numerical Caveats

- The $sqrt{d_k}$ scaling factor is essential for deep models; omitting it leads to vanishing gradients due to softmax saturation.
- Multi‑head attention replicates the above computation across $h$ parallel subspaces, allowing the model to capture diverse relational patterns.
- Attention is fully differentiable, so it can be optimized jointly with the rest of the network using standard gradient‑based methods.
- When queries, keys, and values are identical (self‑attention), the mechanism enables each token to attend to every other token in the same sequence, forming the backbone of Transformer models.

## 🔗 Vault Connections

- [[Attention Intuition Raw | synthesizes | Formal academic derivation of raw user notes]]
- [[Transformer Architecture | prerequisite_for | Understanding scaled dot‑product attention is required before grasping the full Transformer encoder/decoder stack.]]
- [[Self Attention Mechanism | generalizes | The presented derivation is the core of the generic self‑attention mechanism used throughout Transformers.]]
- [[Self-Attention Mechanism: Formal Foundations & Computational Formulation | implements | Provides a detailed mathematical implementation that directly follows the derivation above.]]
- [[Neural Networks | relies_on | Attention layers are stacked on top of standard feed‑forward neural network components.]]
