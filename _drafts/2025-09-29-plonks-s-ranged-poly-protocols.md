---
layout: post
title: "Plonk's S-ranged Polynomial Protocols"
date: 2025-09-30
tags: [cryptography, zkp, kzg, commitment schemes]
math_heavy: true
---

In this post we will analyze Plonk's {% cite gabizon2019plonk %} *S-ranged polynomial protocols* that it introduces in its section 4.1.

If you have not read already, you should see my [previous post]({% post_url 2025-09-29-kzg-poly-commit-scheme %}) as this post will extend on the notions introduced there.


**Disclaimer:** These are my personal notes and understanding of the topic. They may contain errors or oversimplifications. I don't claim to provide absolute truth - rather, I invite discussion and corrections. If you spot any mistakes or have insights to share, please reach out!

## Preliminaries

Some definitions and notes:

- **Polynomial Degree**: $f \in \mathbb{F}_{< n}[X]$ means $f$ is a polynomial with degree less than $n$.

- **Commitment Notation**: The commitment of polynomial $f(X)$ is represented as $[f(x)]_1$ if it is in the first group, and $[f(x)]_2$ if it is in the second group. If no subscript is provided, it is a commitment in the first group.

- **Additive Homomorphism**: The commitment scheme allows for addition and scalar multiplication. This means that for polynomials $f(X)$ and $g(X)$ and a scalar $c$:
    - **Addition**: $[f(x)] + [g(x)] = [f(x) + g(x)]$
    - **Scalar Multiplication**: $c[f(x)] = [c \cdot f(x)]$

- **Pairings**: $e([f]_1, [g]_2)$ takes two arguments and is bilinear:

  $$e(a[f]_1, b[g]_2) = e([f]_1, ab[g]_2) = e(ab[f]_1, [g]_2) = e([f]_1, [g]_2)^{ab}$$

- **Vanishing Polynomial**: For a set $S$, the vanishing polynomial is defined as: 
  
  $$Z_S \coloneqq \prod _{a\in S}(X-a)$$

- **Lagrange Basis Polynomials**: $L_i(X) \in \mathbb{F}_{n}[X]$ is the $i$-th [Lagrange basis polynomial](https://en.wikipedia.org/wiki/Lagrange_polynomial). 
  
  It satisfies: $L_i(\omega^j) = 1$ if $i = j$, and $L_i(\omega^j) = 0$ if $i \neq j$. 
  
  In other words, it takes the value $1$ at the $i$-th point of $H$, and takes the value $0$ for all other values of $H$.

- **KZG**: See my [previous post]({% post_url 2025-09-29-kzg-poly-commit-scheme %}).

## Plonk's S-Ranged Polynomial Protocols

Previously we had seen how KZG {% cite kate2010constant %} allowed us to prove an evaluation of a secret polynomial in zero-knowledge. This is good but when one has multiple identities to check, it does not scale gracefully. For example, Plonk has many constraints and verifying them is checking them at specific points. Running KZG for each of these constraints would not be efficient.

Thankfully Plonk's S-Ranged Polynomial Protocols allow us to prove such statements efficiently. Let us examine this with an example.

Let $p(X)$ be a polynomial and let us prove that it has the following evaluations: $(x_0, y_0), \dots, (x_n, y_n)$. Then,

$$
\begin{align}
S   &\coloneqq \{x_0, \dots, x_n\}      \tag{The range} \\
Z_S(X) &\coloneqq \prod_{i=0}^{n} (X-x_i)  \tag{The vanishing polynomial}
\end{align}
$$

Now, observe that the polynomial $p'(X)$ defined by

$$
\begin{align}
p'(X) \coloneqq p(X) - \sum_{i=0}^{n} y_i L_i(X) \notag
\end{align}
$$

has roots at each point of $S$ only if $p(x)$ passes through all $(x_i, y_i)$ points. Now, if you remember from KZG, if $x'$ is a root of a polynomial then we can divide that polynomial by $X-x'$. Therefore, we can divide $p'(X)$ by all points' corresponding divisor polynomials simultaneously without remainder:

$$
\begin{align}
q(X) \coloneqq 
\dfrac{p'(X)}{Z_S(X)} =
\dfrac{p(X) - \sum_{i=0}^{n} y_i L_i(X)}{\prod_{i=0}^{n} (X-x_i)}  \notag
\end{align}
$$

Like in KZG, the verifier can check if this division is correct by checking the multiplication of the quotient $q(X)$ with the divisor using a pairing. Let us try to write a pairing equation:

$$
\begin{align}
e([q(x)]_1, [Z_S(x)]_2) \stackrel{?}{=} 
e([p(x)]_1 - [l(x)]_1, [1]_2)
\notag
\end{align}
$$

We have a problem, we cannot commit to $Z_S(X)$ like that.

$$
\begin{align}
e([q(x)]_1, Z_S(\zeta)[1]_2) \stackrel{?}{=} 
e([p(x)]_1 - [l(x)]_1, [1]_2)
\notag
\end{align}
$$

## References

{% bibliography --cited %}

## TODO
- Define $l(X)$.