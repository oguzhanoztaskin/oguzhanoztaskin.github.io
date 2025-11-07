---
layout: post
title: "KZG Batching in Plonk"
date: 2025-11-07
tags: [cryptography, zkp, plonk, polynomials, kzg]
math_heavy: true
---

In my last post, we explored the [KZG Polynomial Commitment Scheme]({% post_url 2025-10-13-kzg-poly-commit-scheme %}), a powerful tool for proving that a secret polynomial $p(X)$ evaluates to a certain value $y$ at a public point $z$. That is, we can prove the claim $p(z) = y$.

This is a fantastic building block, but in larger systems like Plonk {% cite gabizon2019plonk %}, we often need to prove more than just one evaluation. We need to prove that a polynomial equation holds true over an entire *set* of points. For example, we might need to prove $P(x) = 0$ for every single $x$ in a domain $H$.

How could we do this? We could run a separate KZG proof for every point in $H$, but if $H$ has thousands of elements, our proof would become enormous and the verification process painfully slow. We need a more efficient way to bundle all these checks into one.

The answer we are looking for is the use of KZG batching. Plonk utilizes a form of batching that's well-suited for its constraint system, and in this post we are going to take a closer look into that approach.

Alternative posts that I recommend are the original paper's Batch Opening paragraph {% cite kate2010constant %} and [Dankrad Feist's blog post's Multiproof section](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html).

**Disclaimer:** These are my personal notes and understanding of the topic. They may contain errors or oversimplifications. I don't claim to provide absolute truth - rather, I invite discussion and corrections. If you spot any mistakes or have insights to share, please reach out!

## Preliminaries

Some definitions and notes we'll be using:

- **Polynomial Degree**: $f \in \mathbb{F}_{< n}[X]$ means $f$ is a polynomial with degree less than $n$.

- **Commitment Notation**: The commitment of a polynomial $f(X)$ is represented as $[f(x)]_1$. Unless specified, commitments are in the first group, $\mathbb{G}_1$.

- **Additive Homomorphism**: Our commitment scheme is additively homomorphic. For polynomials $f(X)$, $g(X)$ and a scalar $c$:
  - **Addition**: $[f(x)] + [g(x)] = [f(x) + g(x)]$
  - **Scalar Multiplication**: $c[f(x)] = [c \cdot f(x)]$

- **Pairings**: $e([f]_1, [g]_2)$ is our bilinear pairing function.

- **Vanishing Polynomial**: For a set of points $S = \{s_0, s_1, \dots, s_{k-1}\}$, the vanishing polynomial is defined as:
  $$Z_S(X) \coloneqq \prod_{i=0}^{k-1} (X - s_i)$$
  This polynomial has a crucial property: it evaluates to $0$ for every single point in the set $S$.

- **Prerequisites**: I'll assume you're familiar with the concepts from my [previous post on KZG]({% post_url 2025-10-13-kzg-poly-commit-scheme %}).

## The Core Idea: From Many Checks to One

Let's say we have a claim: a secret polynomial $P(X)$ is equal to $0$ on every point in a public domain $H$.

The key insight is this: a polynomial $P(X)$ is zero at every point $h$ in $H$ *if and only if* it is divisible by the vanishing polynomial $Z_H(X)$.

Why is this true? From basic algebra, we know that if $P(h) = 0$, then $(X-h)$ must be a factor of $P(X)$. If this is true for *all* $h$ in $H$, then the product of all those factors, which is exactly our vanishing polynomial $Z_H(X)$, must also be a factor of $P(X)$.

This means that if our claim is true, the division must be exact. We can define a quotient polynomial $Q(X)$ like this:

$$
Q(X) \coloneqq \dfrac{P(X)}{Z_H(X)}
$$

This single equation, $P(X) = Q(X) \cdot Z_H(X)$, is equivalent to the $n$ individual checks we started with! Now, our task has been reduced to proving that this new polynomial identity is true.

## The Protocol

How can a prover convince a verifier of this identity? They can't just send the polynomial $Q(X)$, because $P(X)$ is secret, so $Q(X)$ must also be secret.

Instead, we can use polynomial commitments and a random challenge point, very similar to what we did in KZG. By the Schwartz-Zippel lemma, if two polynomials are equal, they will evaluate to the same value at a random point $\zeta$ with very high probability.

So, the verifier will check the identity $P(\zeta) = Q(\zeta) \cdot Z_H(\zeta)$.

**Claim:** A secret polynomial $P(X)$ is $0$ on the public domain $H$.

**Common Inputs:** The vanishing polynomial for the domain $H$, which is $Z_H(X)$.

**Prover Inputs:** The secret polynomial $P(X)$.

**Protocol:**

1.  **Compute the Quotient Polynomial**:
    The prover computes the quotient $Q(X) = \dfrac{P(X)}{Z_H(X)}$. If the claim is false, this division will have a non-zero remainder, and the protocol will fail.

2.  **Commit to Polynomials**:
    The prover commits to the secret polynomials $P(X)$ and $Q(X)$ and sends the commitments $[P(x)]_1$ and $[Q(x)]_1$ to the verifier.

3.  **Get Random Challenge**:
    The verifier generates a random challenge scalar $\zeta$ (zeta) and sends it to the prover. (In a real system, this would be derived from the transcript using Fiat-Shamir).

4.  **Prove the Evaluation**:
    The prover and verifier now want to check the identity $P(\zeta) - Q(\zeta) \cdot Z_H(\zeta) = 0$. This is an evaluation proof! The prover needs to prove that the remainder polynomial $R(X) \coloneqq P(X) - Z_H(\zeta) \cdot Q(X)$ evaluates to $0$ at $X = \zeta$.

    Notice a subtle but important detail here. In the expression for $R(X)$, we use $Z_H(\zeta)$. This is the *evaluation* of the public polynomial $Z_H(X)$ at the point $\zeta$, which is just a scalar value. We do this because we can't multiply two commitments together, but we *can* multiply a commitment by a scalar. Later on, we need to evaluate the entire expression at $\zeta$, so putting $Z_H(X)$'s evaluation here does not cause trouble.

    To prove $R(\zeta) = 0$, the prover computes the KZG witness polynomial:

    $$
    W_\zeta(X) \coloneqq \dfrac{R(X)}{X-\zeta} = \dfrac{P(X) - Z_H(\zeta) \cdot Q(X)}{X-\zeta}
    $$

    The prover commits to this witness, $[W_\zeta(x)]_1$, and sends it to the verifier.

5.  **Verifier Check**:
    The verifier now has all the pieces: $[P(x)]_ 1$, $[Q(x)]_ 1$, and $[W_\zeta(x)]_ 1$. They can perform the final check using a single pairing equation. The verifier wants to confirm that 
    
    $$
    \begin{align}
    W_\zeta(X) \cdot (X - \zeta) &- R(X) &= 0 \notag \\
    W_\zeta(X) \cdot (X - \zeta) &- (P(X) - Z_H(\zeta)\cdot Q(X)) &= 0 \notag
    \end{align}
    $$

    and for that it uses the committed values in the following check:

    $$
    e([W_\zeta(x)]_1, [x]_2 - \zeta[1]_2) \stackrel{?}{=} e([P(x)]_1 - Z_H(\zeta)[Q(x)]_1, [1]_2)
    $$

    Notice that this equation forces the prover to use the committed polynomial $P(X)$, the provided quotient $Q(X)$ to be the true division, and hence the right hand side effectively calculates $[R(x)]_1$.

    Then, the left hand side is designed so that it only holds if $R(X)$ is $0$ at $\zeta$, a random point. As we explained before, this implies the remainder polynomial is exactly $0$ everywhere, that is the division is exact, and therefore $P(X)$ is $0$ on $H$.

## Conclusion

We've just learned a powerful and efficient technique. We've managed to take a claim that required $n$ separate checks ($P(x) = 0$ for all $x$ in $H$) and compress it into a single, compact proof that requires only a few commitments and one pairing check.

## References

{% bibliography --cited %}
