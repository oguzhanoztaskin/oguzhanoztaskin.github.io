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
- Prover includes the proof for equations that show $Z$ is legitimate

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

To proceed, we will need to learn how to do division proofs.

## Division Proofs

Let $P(X)$ be the polynomial we want to show that it is zero on domain $H$, whose vanishing polynomial is $Z_H(X)$. We can state this as $Z_H(X) \mid P(X)$, that is $\exists Q(X)$ such that $P(X) = Q(X)Z_H(X)+R(X)$, where $R(X) = 0$. We will use similar calculations to those shown in section 3 of Plonk's paper. 

Observe that

$$
\begin{align}
P(X) - Q(X)Z_H(X) = R(X) = 0
\end{align}
$$

How do we prove this? I traced $\alpha^2$ terms in Plonk's section 8.3 and improvised:

$$
\begin{align}
Q(X) &= \dfrac{P(X)}{Z_H(X)}        \tag{round 3} \\
R(X) &= P(X) - Z_H(\zeta) \cdot Q(X)    \tag{round 5} \\
W_{\zeta}(X) &= \dfrac{R(X)}{X-\zeta}  \tag{round 5}
\end{align}
$$
where $v, \zeta$ are random variables provided by the verifier. What the above does is reducing the claim $P(X)$ is $0$ over $H$ to the above remainder $R(X)$ is zero everywhere. Note that $R(X)$ has changed, $Z_H(X)$ is evaluated at $\zeta$ now. This is not a problem, and in fact necessary.[^1]

To roll this out:
- Prover: Commit $P(X), Q(X)$
- Verifier: Send $v, \zeta$
- Prover: Commit $W_\zeta(X)$
- Verifier: Checks [^2]\\
$e([W_\zeta]_ 1, [x]_ 2) \stackrel{?}{=} e(\zeta \cdot [W_\zeta]_ 1 + [P(X)]_ 1 - Z_H(\zeta)\cdot[Q(X)]_ 1, [1]_ 2)$
 <!-- + v([P(X)]_ 1-\bar{p}) -->
## References

{% bibliography --cited %}

---

## Footnotes

[^1]: I spotted two reasons. First one: We cannot compute $Z_H(X)\cdot Q(X)$ in the pairing, that would be multiplication of two commitments. We can only multiply a commitment with a public scalar on the verifier's side. Second reason: When the division is exact, which is true for a true proof, $R(X)$ is identically zero and cannot be used further ($W_\zeta(X)$ would be $0$). Instead it is a polynomial that agrees with the remainder polynomial at $\zeta$ and we can prove that it is $0$ at this point. That is the remainder polynomial is $0$ at a random point, thus with high probability it is $0$ everywhere. In other words, the division is exact with high probability.
[^2]: In Plonk section 8, at verifier's 8th step, $r_0$ is subtracted from $R(X)$ and then re-added. It says this is to save verifier a scalar multiplication but I do not see how that works and I omitted it.