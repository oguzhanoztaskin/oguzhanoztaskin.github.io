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

## Sudoku Prover

$P(X)$ is a polynomial where 1-81 contain Sudoku cells and we want to show its rows, columns, and square blocks permute with 1-9, which is represented by $N(X)$ polynomial. That is,

$$
\begin{align}
P(X) = \text{floor(i-1)/9th row}
\end{align}
$$

**Claim:** ~~$P(X)$ is a valid Sudoku solution~~ row $r$ is a permutation of 1-9.

**Steps:**
- Prover commits $P(X)$, we write it as $[P(X)]_1$
- Verifier sends random number $\gamma$
- Prover calculates $Z^{row}(X)$:
$$
\begin{align}
Z^{row}_r(g^i) &= 1 \tag{for $i=1$} \\ 
Z^{row}_r(g^i) &= \prod^{i-1}_{j=1} \dfrac{f^{row}_r(g^j)}{g(g^j)} \tag{for $i \ge 2$}
\end{align}
$$
Then uses IFFT {% cite cooley1965algorithm %} to get its coefficients form. Finally, commits to it: $[Z^{row}_r(X)]_1$.

At this point the verifier needs to check the following via previously described methods $\forall a \in H$:
$$
\begin{align}
L_1(a)Z^{row}_r(a)-1 &= 0 \\
Z^{row}_r(a) \cdot (P(g^{9r} \cdot a) + \gamma^r) 
&= (N(a) + \gamma^r) \cdot Z^{row}_r(a\cdot g)
\end{align}
$$
Therefore,
- Prover commits to $Q(X)$, which is
$$
\begin{align}
Q(X) \coloneqq \dfrac{P(X)}{Z_H(X)}
\end{align}
$$
- Verifier sends the random variable $\zeta$
- Prover commits $W_\zeta(X)$, which is
$$
\begin{align}
W_\zeta(X) \coloneqq \dfrac{P(X)-Z_H(\zeta) \cdot Q(X)}{X-\zeta}
\end{align}
$$
- Verifier checks

## Questions & Answers
1. **Why do we have both $W_\zeta(X), W_{\zeta \omega}(X)$?**

    These are parts of two batched KZG evaluation proofs. The batching is described in Plonk section 3. Simply put, batching allows us to open KZG commitments at different points together. Here, we open the former at $\zeta$, the latter at $\zeta\omega$.

2. **Why do we need $W_{\zeta \omega}(X)$?**

    Because in Plonk round 5, we use the value $\bar{z}_\omega$ in $r(X)$. Value of $\bar{z} _\omega$ is reported by prover, and it is used to prove a claim over $r(X)$. $\bar{z} _\omega$ is supposed to be $Z(\zeta\omega)$, if we do not have this proved, prover may assign it to a value that creates a false proof. Hence, we have it proved.

    Proving that is troublesome, since it is opened at $\zeta\omega$ instead of $\zeta$ as everything else, we need a batched KZG opening proof (see question 1).

3. **Why is $Z(X)$ evaluated at $\zeta\omega$ and not $\zeta$?**

    The equation 2 has $Z(a)$ and $Z(a\omega)$. In Plonk round 5, this equation is constrained as $f(\zeta)\cdot z(X) - g(\zeta)\cdot\bar{z}_\omega$[^3]. Since $Z(X)$ is evaluated at $\zeta\omega$, we had to prove its opening at this value.

    **Why is it constrained this way then?** Because if they opened both $z(X)$ and $z(X\omega)$ at $\zeta$, they would have to prove both of these evaluations, increasing the costs.

    **Why is it opened at $z(\zeta\omega)$ and not $z(\zeta)$ then?** If the constraint was $f(\zeta)\cdot \bar{z} - g(\zeta)\cdot z(X\omega)$, then they would need a commitment to $z(X\omega)$ but we only have a commitment to $z(X)$. Then we would need to derive $[z(X\omega)]_ 1$ from $[z(X)]_ 1$ or prove that it is an $\omega$ shift of $[z(X)]_ 1$. That would be more complicated and costly than what Plonk did.

4. **What do we prove about r(X) and why?**

    We prove that $r(X)$ is identically zero. We prove it because $r(X) = P(X) - t(X)\cdot Z_H(X)$. In other words, if $r(X)$ is identically zero, then the division of $P(X)$ by $Z_H(X)$ is exact, that is $P(X)$ is zero on $Z_H(X)$.

    **Why do we open $r(X)$ at a random point and show it is zero?** This is Schwartz-Zippel lemma {% cite schwartz1980fast zippel1979probabilistic %}. To put it simply, if $r(X)$ is zero at a random point, then it is zero everywhere with high probability.

5. **At Plonk's Prover Round 5, why do we have $S_{\sigma 3}(X)$ and not $\bar{s}_{\sigma 3}$?**

    Because if we had used $\bar{s}_ {\sigma 3}$, then it would be a claim $\bar{s}_ {\sigma 3} \stackrel{?}{=} S_ {\sigma 3}(\zeta)$ and prover would have to prove it or verifier had to calculate it (as $S_ {\sigma 3}(X)$ is public). This would increase the costs, which Plonk avoids. 

    If that statement used $\bar{s}_ {\sigma 3}$, then it would contain no polynomial. Hence when the verifier computes $[D]_ 1, [E]_ 1$, this term would be a scalar multiplier of $[1]_ 1$. This shows us that there is space to use a polynomial commitment. If possible, we should use such spaces as it would be more efficient.

    To sum up, $S_{\sigma 3}(X)$ was a known commitment prior to the verification and hence verifier cannot have chosen a tricky value. When $r(X)$ is evaluated at $\zeta$, this $S_ {\sigma 3}(X)$ necessarily takes the value of $\bar{s}_ {\sigma 3}$ and hence we do not need to put $\bar{s}_ {\sigma 3}$ to its place in $r(X)$. This way it is just more efficient and more convenient.

## References

{% bibliography --cited %}

---

## Footnotes

[^1]: I spotted two reasons. First one: We cannot compute $Z_H(X)\cdot Q(X)$ in the pairing, that would be multiplication of two commitments. We can only multiply a commitment with a public scalar on the verifier's side. Second reason: When the division is exact, which is true for a true proof, $R(X)$ is identically zero and cannot be used further ($W_\zeta(X)$ would be $0$). Instead it is a polynomial that agrees with the remainder polynomial at $\zeta$ and we can prove that it is $0$ at this point. That is the remainder polynomial is $0$ at a random point, thus with high probability it is $0$ everywhere. In other words, the division is exact with high probability.
[^2]: In Plonk section 8, at verifier's 8th step, $r_0$ is subtracted from $R(X)$ and then re-added. It says this is to save verifier a scalar multiplication but I do not see how that works and I omitted it.
[^3]: Actually we do not have $g(\zeta)$ there. $S_{\sigma3}(X)$ is not opened at $\zeta$ and instead kept as is. Though later on when $r(X)$ is evaluated at $\zeta$, this factor of $\bar{z}_\omega$ evaluates to $g(\zeta)$. This is a design choice and it is explained in FAQ.