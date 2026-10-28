> [!ABSTRACT] Formal Academic Synthesis
> 📝 **Original Raw Notes:** [[Data Structures and Algorithms]]
> ⚡ **Generated via Groq LPU** (openai/gpt-oss-120b • Prompt `v1.2.0-academic-rigor` • Oct 23, 2026)

# Data Structures and Algorithms: Foundations, Formal Definitions & Computational Complexity

Data structures provide abstract containers for organizing data, while algorithms are systematic procedures that operate on these structures to solve computational problems efficiently.

## 🧠 Intuition & Conceptual Model

Imagine an array as a row of numbered lockers you can open directly, a tree as a family genealogy where you move from parent to child, a hash table as a set of mailboxes indexed by a quick address‑lookup function, and a graph as a city map where intersections are nodes and roads are edges. These everyday analogies capture why each structure feels natural before we formalize their operations and performance.

## 📚 Formal Definitions & Foundations

### Array
A contiguous block of memory storing elements of a uniform type, indexed by integer positions starting at 0.

### Tree
A connected acyclic graph with a distinguished root node; each node may have zero or more child nodes, forming a hierarchical structure.

### Hash Table
A data structure that maps keys to values using a hash function $h: K \rightarrow \{0,\dots,m-1\}$, where collisions are resolved by chaining or open addressing.

$$$h(k) = (\text{hash}(k) \bmod m)$$$

### Graph
A pair $G = (V, E)$ where $V$ is a set of vertices (nodes) and $E \subseteq V \times V$ is a set of edges representing relationships between vertices.

### Sorting Algorithm
A procedure that rearranges a sequence of elements into a total order according to a comparator.

### Searching Algorithm
A method for locating a target element within a data structure, returning its position or a failure indicator.

## 📐 Mathematical Formulation & Step-by-Step Derivations

### Time Complexity of Binary Search
**Premise / Objective:** Derive the worst‑case number of comparisons for searching a sorted array of size $n$ using binary search.

**Step-by-Step Derivation:**
1. At each step the search interval is halved: $n \rightarrow \frac{n}{2} \rightarrow \frac{n}{4} \dots$
2. The process stops when the interval size becomes 1, i.e., after $k$ halvings where $\frac{n}{2^{k}} = 1$.
3. Solve for $k$: $2^{k}=n \Rightarrow k = \log_{2} n$.
4. Thus the number of comparisons $T(n) = \Theta(\log n)$.

> **Conclusion:** $T_{binary\,search}(n) = \Theta(\log n)$

### Merge Sort Recurrence via Master Theorem
**Premise / Objective:** Obtain the asymptotic running time of merge sort, which splits the array into two halves, sorts each recursively, and merges in linear time.

**Step-by-Step Derivation:**
1. Recurrence relation: $T(n) = 2\,T\left(\frac{n}{2}\right) + cn$, for $n>1$, with $T(1)=d$.
2. Identify parameters for Master Theorem: $a=2$, $b=2$, $f(n)=cn$.
3. Compute $n^{\log_{b} a}=n^{\log_{2} 2}=n$.
4. Since $f(n)=\Theta(n^{\log_{b} a})$, we are in case 2 of the Master Theorem, giving $T(n)=\Theta(n\log n)$.

> **Conclusion:** $T_{merge\,sort}(n) = \Theta(n\log n)$

## ⚖️ Core Theorems & Principles

- **Master Theorem for Divide-and-Conquer Recurrences**: For recurrences of the form $T(n)=a\,T\left(\frac{n}{b}\right)+f(n)$ with $a\ge1$, $b>1$, the asymptotic behavior is determined by comparing $f(n)$ with $n^{\log_{b} a}$.
  - *Implication:* Provides a systematic way to derive $\Theta$ bounds for many classic algorithms such as merge sort, quicksort, and binary search.
- **Big‑O Definition**: $f(n)=O(g(n))$ iff there exist constants $c>0$ and $n_{0}$ such that $0\le f(n)\le c\,g(n)$ for all $n\ge n_{0}$.
  - *Implication:* Allows us to classify algorithmic running times and space usage up to constant factors, enabling meaningful comparisons.
- **Pigeonhole Principle**: If $n$ items are placed into $m$ containers and $n>m$, then at least one container holds more than one item.
  - *Implication:* Justifies the inevitability of hash collisions when the number of keys exceeds the table size.

## 💡 Key Takeaways & Numerical Caveats

- Sorting stability matters when the relative order of equal keys must be preserved (e.g., mergesort is stable, quicksort is not by default).
- Hash table performance degrades with high load factor; rehashing or using a larger table mitigates collision overhead.
- Unbalanced binary search trees can degenerate to $\Theta(n)$ height; self‑balancing trees (AVL, Red‑Black) guarantee $\Theta(\log n)$ operations.
- Graph representations (adjacency list vs. matrix) trade off memory usage versus edge‑lookup speed; choose based on density.

## 🔗 Vault Connections

- [[Data Structures and Algorithms | synthesizes | Formal academic derivation of raw user notes]]
- [[Graph Theory | prerequisite_for | Understanding graphs is essential for implementing graph‑based data structures such as adjacency lists, and for algorithms like BFS and Dijkstra.]]
