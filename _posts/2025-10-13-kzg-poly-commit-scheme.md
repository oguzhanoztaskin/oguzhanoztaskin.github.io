---
layout: post
title: "KZG Polynomial Commitment Scheme"
date: 2025-10-13
tags: [cryptography, zkp, kzg, commitment schemes]
math_heavy: true
---

KZG polynomial commitment scheme {% cite kate2010constant %} is a fundamental building block for many zero-knowledge proof systems, including Plonk {% cite gabizon2019plonk %}. In this post, I'll explain how KZG works and provide the groundwork needed for understanding more complex protocols.

My goal is making these posts implementation oriented - not too abstract. However, some used concepts will not be described in full, this will be more like _some notes on cryptography_.

For more complete, reliable, and more reviewed text you may refer to [Dankrad Feist's blog](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html) or to the original paper {% cite kate2010constant %}.

**Disclaimer:** These are my personal notes and understanding of the topic. They may contain errors or oversimplifications. I don't claim to provide absolute truth - rather, I invite discussion and corrections. If you spot any mistakes or have insights to share, please reach out!

## Preliminaries

Some definitions and notes:

**Polynomial Degree**: $f \in \mathbb{F}_{< n}[X]$ means $f$ is a polynomial with degree less than $n$.

**Commitment Notation**: The commitment of polynomial $f(X)$ is represented as $[f(x)]_1$ if it is in the first group, and $[f(x)]_2$ if it is in the second group. If no subscript is provided, it is a commitment in the first group.

**Additive Homomorphism**: The commitment scheme allows for addition and scalar multiplication. This means that for polynomials $f(X)$ and $g(X)$ and a scalar $c$:
  - **Addition**: $[f(x)] + [g(x)] = [f(x) + g(x)]$
  - **Scalar Multiplication**: $c[f(x)] = [c \cdot f(x)]$

**Pairings**: $e([f]_1, [g]_2)$ takes two arguments and is bilinear:

$$e(a[f]_1, b[g]_2) = e([f]_1, ab[g]_2) = e(ab[f]_1, [g]_2) = e([f]_1, [g]_2)^{ab}$$


## What is KZG?

KZG is the polynomial commitment scheme (PCS) used by Plonk, and the PCS I chose to use for my work.
A polynomial commitment scheme is a protocol that allows the prover to commit to a polynomial, and then in zero-knowledge prove its evaluation at a given point.

The high level idea of KZG is that

- If a polynomial $p(X)$ passes through $(x_0, y_0)$, then the polynomial $p'(X) \coloneqq p(X)-y_0$ is $0$ at $X=x_0$.
- Then $p'(X)$ has a root at $X=x_0$. That is, $X-x_0$ is a factor of it and if we divide $p'(X)$ by this value, the division must be exact.
- If we can prove that the division is exact, for example by multiplying the quotient with the divisor and checking if the result is the same as the expected dividend, we would be proving the polynomial evaluation.
- That multiplication can be proven using elliptic curves and pairings. That is what KZG does.

In the following section, I explain this by showing each step.

## The Protocol

**Claim:** $p(X) \in \mathbb{F}_{< n}[X]$ is a private polynomial and it passes through the public point $(x_0, y_0)$.

**Setup:** Trusted setup provides the commitments $[1]_1, [x]_1, [x^2]_1, \dots, [x^{n-1}]_1$ and $[1]_2, [x]_2$. This is called the Structured Reference String, or SRS for short.

Here, $x$ is a toxic variable that no one should know. It is required for the generation of SRS, but then it must be destroyed. Because if someone knows $x$, they can make false proofs, i.e. showing a polynomial passes through a point when it actually does not.

**Common Inputs:** $(x_0, y_0) \in \mathbb{F}^2$

**Prover Inputs:** $p(X) \in \mathbb{F}_ {< n}[X]$, written as $p(X) = c_ 0 + c_ 1 X + c_ 2 X^2 + \dots + c_{n-1} X^{n-1}$

**Protocol:**

1. **Compute the Quotient Polynomial**:

    Prover computes the quotient polynomial $q(X) \coloneqq \dfrac{p(X) - y_0}{X-x_0}$

    Notice that for this to be true, there should be no remainder polynomial. This is true if the claim $p(x_0) \stackrel{?}{=} y_0$ is true. To see this, assume the claim. Then observe the polynomial $p(X) - y_0$ has a root at $X=x_0$:

    $$
    \begin{align}
    (p(X) - y_0)\mid_{X=x_0} &= p(x_0) - y_0 \notag \\
    p(x_0) - y_0 &= y_0 - y_0 = 0 \notag \\
    \end{align}
    $$

    Therefore, $X-x_0$ is a factor of it and thus the division is exact, i.e. the remainder polynomial of the division is $0$.

2. **Commit to Polynomials**:

    Prover commits to $p(X), q(X)$, that is using SRS it computes

    $$
    \begin{align}
    [p(x)]_1 &= c_0[1]_1 + c_1[x]_1 + \dots + c_{n-1}[x^{n-1}]_1 \notag \\
    [q(x)]_1 &= c^q_0[1]_1 + c^q_1[x]_1 + \dots + c^q_{m-1}[x^{m-1}]_1 \notag \\
    \end{align}
    $$

    This computation is possible due to the following facts: commitments to the powers of $x$, i.e. $[x^j]_1$, are present in the SRS, and the commitment scheme is additively homomorphic. Therefore, we can compute the scalar multiplications, e.g. $c_1[x]_1$, and then sum these scaled commitments together. This is called **multiscalar multiplication (MSM)**.

    $$
    \begin{align}
    [p(x)]_1 = \sum_{i=0}^{n-1} c_i[x^i]_1 \tag{$n-1$ is the degree of $p(X)$}
    \end{align}
    $$

    Notice that the commitment is just evaluating the polynomial at $X=x$, the toxic waste, and taking that to the elliptic curve.

3. **Send Commitments**:

    Prover sends $[p(x)]_1, [q(x)]_1$ to the verifier.

4. **Verifier Check**:

    Verifier checks the equation:

    $$
    \begin{align}
    e([q(x)]_1, [x]_2 + (-x_0)[1]_2) &\stackrel{?}{=} e([p(x)]_1 + (-y_0)[1]_1,[1]_2) \notag \\
    \end{align}
    $$

    If the check passes, the verifier accepts the claim $p(x_0) \stackrel{?}{=} y_0$.

## Understanding the Pairing Equation

The pairing allows us to represent the multiplication of two commitments, the divisor and the quotient as a target group element (the output of the pairing). That is, we reconstructed the dividend as a target group element on the left hand side. Then, we put the expected dividend on the right hand side. Finally, we checked if the two pairings are equivalent.

The important fact here is that we could not simply multiply the quotient and the divisor commitments because we only have addition. The pairing gave us a workaround for this: representing that multiplication as its target group's element.

In other words, the pairing helped us revert the division to a multiplication and check its result.

**Reading a pairing equation:** Apply the following transformations:

- Every commitment is an evaluation at $x$, the toxic variable. Revert it by replacing $x$ with $X$.
- $e(a, b)$ is just $a\cdot b$.

Therefore, if we apply them to the pairing equation, we get

$$
\begin{align}
q(X)\cdot(X-x_0) \stackrel{?}{=} p(X) - y_0 \notag
\end{align}
$$

This is *a conceptual transformation* I use for ease of reading. Some information is lost during this transformation and hence it does not perfectly represent the pairing. Alternatively, Dankrad {% cite feist2020kate %} writes this pairing in the target group:

$$
\begin{align}
[q(x)\cdot(x-x_0)]_T \stackrel{?}{=} [p(x) - y_0]_T \notag
\end{align}
$$

## Conclusion

We have seen fundamental concepts like how to compute a commitment to a polynomial, how additive homomorphism works, how pairings work, and how KZG's protocol is designed. We will build on these in the later posts where we work on more complicated ideas.

## References

{% bibliography --cited %}
