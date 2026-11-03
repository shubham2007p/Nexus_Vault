> [!ABSTRACT] Formal Academic Synthesis
> 📝 **Original Raw Notes:** [[Large Language Models: Foundations, Architecture, and Training Paradigms]]
> ⚡ **Generated via Groq LPU** (openai/gpt-oss-120b • Prompt `v1.2.0-academic-rigor` • Oct 23, 2026)

# Large Language Models: Foundations, Architecture, and Training Paradigms

Large Language Models (LLMs) are deep neural networks based on the Transformer architecture that generate or understand natural language by predicting the next token, trained via a two‑stage pre‑training and fine‑tuning pipeline.

## 🧠 Intuition & Conceptual Model

The student imagines an LLM as a translator: first it converts raw text into a dense numeric embedding (the encoder step), forming an internal mental picture, then it uses that representation to guess the next word (the decoder step).  The attention metaphor captures how the model dynamically focuses on the most relevant words, much like a human reader pays extra attention to certain clues when completing a sentence.

## 📚 Formal Definitions & Foundations

### Large Language Model (LLM)
A parameterized function that maps a sequence of tokens to a probability distribution over the vocabulary for the next token.

$$P(w_t\mid w_{<t}) = f_{\theta}(w_{<t})$$

### Token
The smallest discrete unit (word, sub‑word, or character) in the model's vocabulary \(\mathcal{V}\).

### Embedding
A learned vector representation for each token, obtained via an embedding matrix.

$$\mathbf{e}_w = E_{w,:}$$

### Transformer Architecture
A stack of multi‑head self‑attention layers followed by position‑wise feed‑forward networks, with residual connections and layer normalization.

$$\text{TransformerLayer}(X)=\text{FFN}(\text{LN}(X+\text{MHSA}(X)))$$

### Scaled Dot‑Product Attention
Core attention operation that computes weighted sums of value vectors using softmax‑normalized dot products of queries and keys, scaled by \(\sqrt{d_k}\).

$$\text{Attention}(Q,K,V)=\text{softmax}\Big(\frac{QK^{\top}}{\sqrt{d_k}}\Big)V$$

### Pre‑training
Unsupervised phase that maximizes the likelihood of next‑token prediction over a large generic corpus.

$$\mathcal{L}_{\text{pre}} = -\sum_{t}\log P(w_t\mid w_{<t};\theta)$$

### Fine‑tuning
Supervised adaptation of a pre‑trained LLM on a downstream task using a task‑specific loss.

$$\mathcal{L}_{\text{ft}} = -\sum_{(x,y)\in\mathcal{D}_{\text{task}}}\log P(y\mid x;\theta)$$

## 📐 Mathematical Formulation & Step-by-Step Derivations

### Chain‑Rule Factorization of Sequence Probability
**Premise / Objective:** Derive the probability of a token sequence as a product of conditional probabilities.

**Step-by-Step Derivation:**
1. Start with the joint probability $P(w_1,\dots,w_T)$.
2. Apply the chain rule: $P(w_1,\dots,w_T)=\prod_{t=1}^{T}P(w_t\mid w_{<t})$.
3. Recognize each factor $P(w_t\mid w_{<t})$ is modeled by the LLM.

> **Conclusion:** $$P(w_{1:T}) = \prod_{t=1}^{T}P(w_t\mid w_{<t};\theta)$$

### Scaled Dot‑Product Attention Computation
**Premise / Objective:** Show how queries, keys, and values produce attention outputs.

**Step-by-Step Derivation:**
1. Form query matrix $Q = XW_Q$, key matrix $K = XW_K$, value matrix $V = XW_V$ where $X$ are input embeddings.
2. Compute raw scores $S = QK^{\top}$.
3. Scale scores: $\hat{S}=S/\sqrt{d_k}$.
4. Apply softmax: $A = \text{softmax}(\hat{S})$.
5. Obtain output: $O = AV$.

> **Conclusion:** $$\text{Attention}(X)=\text{softmax}\Big(\frac{XW_Q (XW_K)^{\top}}{\sqrt{d_k}}\Big)XW_V$$

## ⚖️ Core Theorems & Principles

- **Universal Approximation of Transformers**: A Transformer with sufficient depth, width, and appropriate positional encodings can approximate any continuous sequence‑to‑sequence function on compact domains to arbitrary precision.
  - *Implication:* Justifies the empirical success of deep Transformer‑based LLMs across diverse language tasks.
- **Attention Is All You Need (2017)**: Replacing recurrent or convolutional components with multi‑head self‑attention yields models that achieve state‑of‑the‑art performance on translation benchmarks while enabling parallel computation.
  - *Implication:* Underpins the architectural shift from RNN‑based language models to Transformer‑based LLMs.

## 💡 Key Takeaways & Numerical Caveats

- Scaling laws: model performance improves predictably with the logarithm of model size, data quantity, and compute budget.
- Tokenization choice (e.g., BPE vs. unigram) heavily influences vocabulary size and downstream efficiency.
- Fine‑tuning can cause catastrophic forgetting; techniques like LoRA or adapters mitigate this.
- Inference latency is dominated by the quadratic $O(n^2)$ cost of self‑attention; efficient variants (e.g., FlashAttention, linear‑attention) are active research areas.

## 🔗 Vault Connections

- [[Large Language Models: Foundations, Architecture, and Training Paradigms | synthesizes | Formal academic derivation of raw user notes]]
- [[Transformer Architecture | prerequisite_for | Understanding LLMs requires the full Transformer stack, which defines the core layers used in LLMs.]]
- [[Self Attention Mechanism | relies_on | Self‑attention is the core operation that enables LLMs to weight different parts of the input sequence.]]
- [[Scaled Dot‑Product Attention: Intuition, Formalism & Computational Formulation | implements | Provides the detailed mathematical formulation used in every Transformer layer of an LLM.]]
- [[Neural Networks | generalizes | Transformers are a specific class of deep neural networks; broader NN concepts apply to LLMs.]]
- [[Deep Learning Architecture | prerequisite_for | LLMs sit within the broader family of deep learning models and inherit architectural design principles.]]
- [[Large Language Model | synthesizes | This note consolidates formal definitions, derivations, and training paradigms for LLMs.]]
