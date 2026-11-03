> [!NOTE] Captured Knowledge
> 💬 **Source Conversation:** [[Algorithmic Information Theory & Kolmogorov]]
> 🕒 **Captured on:** Nov 2, 2026

# Kolmogorov Complexity and Incompressibility

The Kolmogorov complexity $K(s)$ of a string $s$ is the length of the shortest computer program that outputs $s$:

$$K(s) = \min_{p} \{ |p| : U(p) = s \}$$

## Incompressible Strings
A string $s$ is considered algorithmically random or **incompressible** if $K(s) \ge |s| - c$ for a small constant $c$.

```python
def kolmogorov_approx(data: bytes) -> int:
    import zlib
    return len(zlib.compress(data))
```

See also: [[Algorithmic Probability]] and [[Chaitins Constant]].

## Captured Conversation Insights (Nov 2, 2026)
> 💬 **Source Conversation:** [[Algorithmic Information Theory & Kolmogorov]]
> 🔗 **Message Provenance:** `msg_eb14d556ddc14c78b88f29e438e5dab8`

# Kolmogorov Complexity and Incompressibility

The Kolmogorov complexity $K(s)$ of a string $s$ is the length of the shortest computer program that outputs $s$:

$$K(s) = \min_{p} \{ |p| : U(p) = s \}$$

## Incompressible Strings
A string $s$ is considered algorithmically random or **incompressible** if $K(s) \ge |s| - c$ for a small constant $c$.

```python
def kolmogorov_approx(data: bytes) -> int:
    import zlib
    return len(zlib.compress(data))
```

See also: [[Algorithmic Probability]] and [[Chaitins Constant]].
