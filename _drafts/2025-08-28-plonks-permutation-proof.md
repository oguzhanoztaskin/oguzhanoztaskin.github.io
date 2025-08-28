---
layout: post
title: "Plonk's Permutation Proof"
date: 2025-08-28
tags: [cryptography, zkp, plonk, permutation]
---

I decided to understand and implement the permutation proof of Plonk {% cite gabizon2019plonk %}. This will be required for a later post.

The paper is not explicit in certain things I am new to, so I might have some mistakes. I also have some changes or guesses, like figuring out the implementation and applying Fiat-Shamir process. I describe the protocol in prover's perspective, and I add verifier's actions where necessary.

Plonk, in its fifth section, describes a permutation proof between two private polynomials, $f, g \in \mathbb{F}_{< n}[X]$ and a public permutation $\sigma$. The protocol rolls out as the following.

- Prover commits to $f, g$ and writes it to the transcript.
- Prover samples random $\beta, \gamma$ from the transcript.
- Prover computes $f' = f + \beta \cdot S_{ID} + \gamma$, $g' = g + \beta \cdot S_{\sigma} + \gamma$. The verifier constructs commitments to $f', g'$ using commitments to $f, g, S_{ID}, S_{\sigma}$.
- Prover computes $Z\in \mathbb{F}_{< n}[X]$ value-by-value for each $i\in [n]$ and then uses Lagrange interpolation to build its polynomial: $Z(g^i) = \prod _{1\le j < i}f'(g^j)/g'(g^j)$.
- Prover commits to $Z$ and writes the commitment to the transcript.
- Prover includes the proof for equations

$$
\begin{align}
    L_1(a)(Z(a)-1) &=0,\ \forall a \in H\\
    Z(a)f'(a) - g'(a)Z(a\cdot g) &= 0,\ \forall a \in H
\end{align}
$$

The last step is explained in detail in the next section.

## Proving Arguments Over Sets
Equations 1 and 2 need to be proved on a set of inputs, called $H$.
In other words, these equations are only true on this subset and can be wrong outside. Plonk defines such polynomial protocols to be **S-ranged polynomial protocols** and discusses how to turn them into regular polynomial protocols in its section 4.

Essentially, this section shows that if $Z_S \coloneqq \prod _{a\in S}(X-a)$ divides a polynomial $P(X)$, then with high probability $P(X)$ is $0$ on entire $S$.

If this does not make sense to you, consider it as the following: If a polynomial $P(X)$ has roots at points $a, b, c$, then $P(X)$ has factors such that we can write $P(X) = Q(X)(X-a)(X-b)(X-c)$. Then clearly it is divisible by all of these points simultaneously. The product of these points is $Z_S(X) = (X-a)(X-b)(X-c)$, which is the vanishing polynomial on $S = \{a,b,c\}$.

In our equations above, we have $Z_H \coloneqq \prod _{a\in H}(X-a)$ and we need to show the right hand side of the equations are divisible by $Z_H$. We can do this with high probability only if the equations evaluate to $0$ on each point of $H$. That is exactly what we want.

## Actually Dividing
We will first show the first equation. Let

$$
\begin{align}
    P_1(X) &\coloneqq L_1(X)(Z(X)-1) \\
    Z_H(X) &\coloneqq \prod_{a\in H} (X-a)
\end{align}
$$

We want to show $Z_H(X) \mid P_1(X)$, that is $\exists W_1(X)$ such that $P_1(X) = W_1(X)Z_H(X)$. We will use similar calculations to those shown in section 3 of Plonk's paper. 

Observe that

$$
\begin{align}
W_1(X)Z_H(X) - P_1(X) = 0
\end{align}
$$

## References

{% bibliography --cited %}