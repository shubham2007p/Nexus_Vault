> [!ABSTRACT] Formal Academic Synthesis
> 📝 **Original Raw Notes:** [[Attention Mechanism Test 1792681666247]]
> ⚡ **Generated via Groq LPU** (openai/gpt-oss-120b • Prompt `v1.2.0-academic-rigor` • Oct 22, 2026)

# Self-Attention Mechanism: Formal Foundations & Computational Formulation

Self‑attention computes a weighted representation of a sequence by measuring similarity between query and key vectors, normalising with softmax, and aggregating value vectors, enabling each token to attend to all others.

## 🧠 Intuition & Conceptual Model

The raw analogy likens attention to looking up a word in a dictionary: the query is the word you search, keys are the dictionary headwords, and values are the definitions. The dot‑product measures how well the query matches each headword, softmax turns these matches into a probability distribution, and the weighted sum of definitions yields the contextual meaning—exactly what the formal self‑attention does.

## 📚 Formal Definitions & Foundations

### Query (Q)
A learned linear projection of the input token embedding that represents the seeking information.

$$$Q = XW_Q$$$

### Key (K)
A learned linear projection of the input token embedding that represents searchable content.

$$$K = XW_K$$$

### Value (V)
A learned linear projection of the input token embedding that carries the information to be aggregated.

$$$V = XW_V$$$

### Scaled Dot‑Product Attention
The core attention operation that computes similarity scores, scales them, normalises with softmax, and aggregates values.

$$$\text{Attention}(Q,K,V)=\text{softmax}\Bigl(\frac{QK^{\top}}{\sqrt{d_k}}\Bigr)V$$$

### Softmax
A function that maps a vector of real numbers to a probability distribution that sums to one.

$$$\text{softmax}(z_i)=\frac{e^{z_i}}{\sum_j e^{z_j}}$$$

### Context Vector
The output of the attention layer for a given query, representing a weighted sum of value vectors.

$$$c_i = \sum_j \alpha_{ij} V_j$ where $\alpha_{ij}=\text{softmax}\bigl(\frac{q_i\cdot k_j}{\sqrt{d_k}}\bigr)$$$

### Multi‑Head Attention
Parallel execution of several self‑attention operations with independent projections, concatenated and linearly transformed.

$$$\text{MultiHead}(Q,K,V)=\text{Concat}(\text{head}_1,\dots,\text{head}_h)W_O$$$

## 📐 Mathematical Formulation & Step-by-Step Derivations

### Derivation of Scaled Dot‑Product Attention
**Premise / Objective:** Start from raw similarity scores between queries and keys and obtain a stable, differentiable weighting scheme.

**Step-by-Step Derivation:**
1. Compute raw scores: $S = QK^{\top}$
2. Scale to mitigate large variance: $\hat{S}=\frac{S}{\sqrt{d_k}}$
3. Apply softmax to obtain attention weights: $\alpha = \text{softmax}(\hat{S})$
4. Form context vectors by weighted sum: $\text{Attention}(Q,K,V)=\alpha V$

> **Conclusion:** The final expression $\text{Attention}(Q,K,V)=\text{softmax}\bigl(\frac{QK^{\top}}{\sqrt{d_k}}\bigr)V$.

### Gradient of Attention Weights w.r.t. Queries
**Premise / Objective:** Derive $\frac{\partial \alpha_{ij}}{\partial q_i}$ for back‑propagation.

**Step-by-Step Derivation:**
1. Recall $\alpha_{ij}=\frac{e^{\hat{s}_{ij}}}{\sum_{l}e^{\hat{s}_{il}}}$ with $\hat{s}_{ij}=\frac{q_i\cdot k_j}{\sqrt{d_k}}$
2. Differentiate using quotient rule and softmax Jacobian: $\frac{\partial \alpha_{ij}}{\partial \hat{s}_{ik}} = \alpha_{ij}(\delta_{jk}-\alpha_{ik})$
3. Chain rule gives $\frac{\partial \alpha_{ij}}{\partial q_i}=\frac{1}{\sqrt{d_k}}\sum_k \alpha_{ij}(\delta_{jk}-\alpha_{ik})k_k$

> **Conclusion:** Provides the necessary term for back‑propagation through the attention layer.

## ⚖️ Core Theorems & Principles

- **Softmax Normalisation Property**: For any vector $z$, $\sum_i \text{softmax}(z)_i = 1$ and each component lies in $(0,1)$.
  - *Implication:* Ensures attention weights form a valid probability distribution, enabling interpretable weighting of values.
- **Scaling Lemma for Dot‑Product Attention**: Dividing $QK^{\top}$ by $\sqrt{d_k}$ bounds the variance of the pre‑softmax logits, preventing saturation of the softmax.
  - *Implication:* Improves gradient flow during training, especially for large hidden dimensions.

## 💡 Key Takeaways & Numerical Caveats

- The $\sqrt{d_k}$ scaling is essential for numerical stability; without it, large $d_k$ leads to extremely peaked softmax distributions and vanishing gradients.
- Masking (e.g., causal mask) must be applied before softmax to prevent attention to future tokens in autoregressive models.
- Multi‑head attention allows the model to capture information from different representation subspaces simultaneously.

## 🔗 Vault Connections

- [[Attention Mechanism Test 1792681666247 | synthesizes | Formal academic derivation of raw user notes]]
- [[Transformer Architecture | prerequisite_for | Self‑attention is the core building block of the Transformer encoder and decoder.]]
- [[Self Attention Mechanism | generalizes | The formal derivation expands the informal intuition into the scaled dot‑product formulation.]]
- [[Attention Intuition Raw | relies_on | Preserves the dictionary‑lookup analogy that motivated the formal definition.]]
- [[Neural Networks | prerequisite_for | Understanding linear projections $W_Q,W_K,W_V$ requires basic neural network concepts.]]
- [[Gradient Descent | implements | Training the projection matrices relies on gradient‑based optimisation.]]
- [[Matrix Calculus | prerequisite_for | Deriving gradients of the attention operation uses matrix‑calculus rules.]]


## Additional Lecture Revisions
- Added verified numerical scaling factor 1/sqrt(d_k).