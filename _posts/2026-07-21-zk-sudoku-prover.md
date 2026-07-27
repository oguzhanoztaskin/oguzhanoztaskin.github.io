---
layout: post
title: "A Zero-Knowledge Sudoku Prover"
date: 2026-07-21
tags: [cryptography, zkp, plonk, sudoku]
math_heavy: true
---

In the previous posts we built up some machinery: the [KZG Polynomial Commitment Scheme]({% post_url 2025-10-13-kzg-poly-commit-scheme %}) for committing to a secret polynomial and proving its evaluations, and [KZG Batching in Plonk]({% post_url 2025-11-07-kzg-batching-in-plonk %}) for turning "this polynomial is zero on the whole domain $H$" into a single quotient check. I promised these would pay off in a later post where we do something more complicated. This is that post.

The something is a real, working zero-knowledge prover for Sudoku: *I know a valid completion of this puzzle, and I won't show it to you.* I built a complete polynomial-IOP argument system over BN254 in Rust (arkworks), blinded for zero knowledge, made non-interactive with Fiat–Shamir, and compiled the whole thing to WebAssembly so you can [play with it in your browser](#try-it) at the end of this post.

**Disclaimer:** These are my personal notes and understanding of the topic. They may contain errors or oversimplifications. I don't claim to provide absolute truth — rather, I invite discussion and corrections. If you spot any mistakes or have insights to share, please reach out!

## Sudoku is a pile of multiset constraints

Strip Sudoku down to its logic. An $n \times n$ grid (with $n = k^2$, so $k=3$ is ordinary $9\times9$) is a witness: one function from $n^2$ cells to values $\lbrace 1,\dots,n \rbrace$. The rules are $3n$ constraints — $n$ rows, $n$ columns, $n$ boxes — and every single one of them asserts *the same thing*:

> these $n$ cells contain each of $1,\dots,n$ exactly once.

That is a **multiset equality**: the multiset of values in the group equals $\lbrace 1,2,\dots,n \rbrace$. Nothing about *where* a value sits inside the group matters, only *which* values are present and how many times. This is the structure we want to exploit.

## Naive attempt: sums and products

Here is the first design that comes to mind, and it's wrong. A group holds $\lbrace 1,\dots,n \rbrace$ iff its values sum to $1+2+\dots+n$ and multiply to $n!$, right? So just constrain the sum and the product of each row, column, and box. Clean, cheap, no fancy arguments.

It's unsound. Consider this multiset for $n=9$:

$$
\lbrace 1,2,4,4,4,5,7,9,9 \rbrace
$$

Its sum is $45$ and its product is $362{,}880 = 9!$ — both statistics match $\lbrace 1,\dots,9 \rbrace$ exactly — yet it has three 4's and no 3, 6, or 8. Even if you *also* range-constrain every cell to $\lbrace 1,\dots,9 \rbrace$, a cheating prover can still slip this past you.

The fix is to not check *fixed* statistics but a *randomized* one.

## The multiset check we actually want

Two multisets $A = \lbrace a_j \rbrace$ and $B = \lbrace b_j \rbrace$ of equal size are equal if and only if the polynomials $\prod_j (X + a_j)$ and $\prod_j (X + b_j)$ are identical. By Schwartz–Zippel {% cite schwartz1980fast zippel1979probabilistic %}, if we evaluate both at a *random* $\gamma$ drawn after the prover has committed, they agree only with probability $n/\lvert\mathbb{F}\rvert$ unless the multisets are truly equal. The spoof above dies here: as a polynomial in $\gamma$, $\prod (\gamma + a_j)$ for that bad multiset simply is not $\prod_{i=1}^{9}(\gamma + i)$.

So for each group $g$ we want to check

$$
\prod_{j \in g} \big(f(\mathrm{cell}_j) + \gamma\big) \;=\; \prod_{i=1}^{n} (i + \gamma).
$$

The right-hand side is the same for every group and depends only on public data — call it $P(\gamma)$. The verifier can compute it itself in $n$ multiplications.

How do we prove a *product over a group* inside a polynomial IOP? With a running product, exactly the grand-product accumulator $Z$ from Plonk's permutation argument {% cite gabizon2019plonk %}. We start $Z=1$ at the beginning of a group and multiply in one factor $(f+\gamma)$ per step, so that at the end of the group $Z$ equals the accumulated product. Then we check the accumulated product equals $P(\gamma)$.

## One commitment, read many ways

I commit the whole solution **exactly once**, as a single polynomial $f$. Let $p = 2^{\lceil \log_2 n \rceil}$ be the "pitch" (16 for $9\times9$), and put cell $(r,c)$ at domain index $p \cdot r + c$:

$$
f(\omega^{\,pr+c}) = \text{value of cell } (r,c), \qquad 0 \le r,c < n,
$$

with the leftover padding slots set to zero. The domain $H = \langle \omega \rangle$ has size $N = p^2$.

Now the trick: rows, columns, and boxes are all traversals of this *same* commitment, each with its own multiplicative step. Advancing the argument $x \mapsto \sigma x$ moves us to a neighbouring cell:

- **rows** step by $\omega$ (stride 1),
- **columns** step by $\omega^{p}$ (stride $p$),
- **boxes** step by $\omega$ inside a box-row and by $\omega^{\,p-k+1}$ when wrapping to the next box-row.

Because a cell in row $r$ is read by the row traversal *and* by a column traversal *and* by a box traversal — all against the identical committed $f$ at the identical domain point — cross-constraint consistency comes for free. There are no copy constraints, no wiring permutation, no duplicated witness columns. If a cheater swaps two values within a row (preserving that row's multiset), the column constraints reading the same commitment catch it. This is a nice payoff from committing once.

Each family gets some public **selector** polynomials, fixed at setup from the grid geometry alone: $q_{\mathsf{start}}$ marks where each group begins, $q_{\mathsf{step}}$ marks the traversal steps, $q_{\mathsf{end}}$ marks group ends.

## The hidden shuffle argument

Here is the whole idea in one sentence: **take Plonk's permutation argument and delete the coordinate binding.**

Plonk's permutation product accumulates factors of the form $(w_i + \beta\,\sigma(i) + \gamma)$, where the $\beta\,\sigma(i)$ term ties each value to *its position* — that's what makes it prove a *permutation* rather than just a *multiset*. But Sudoku doesn't care about position; it only cares about the multiset. So set $\beta = 0$. The coordinate binding vanishes and the argument degenerates — usefully — into exactly the multiset check we derived above.

One thing falls out of this, and it is what makes the argument so cheap: the right-hand side $P(\gamma) = \prod_{i=1}^n (i+\gamma)$ is a **public scalar**. Plonk's permutation argument compares two witness-dependent products against each other; here the target multiset is fixed and public, so that entire side collapses to one number the verifier computes for itself. Nothing has to be committed for it.

Each family carries one accumulator $Z$, and we enforce, for all $x \in H$:

$$
\begin{align}
q_{\mathsf{start}}(x)\,\big(Z(x) - 1\big) &= 0, \notag \\
q_{\mathsf{step}}(x)\,\big(Z(\sigma x) - Z(x)(f(x) + \gamma)\big) &= 0, \notag \\
q_{\mathsf{end}}(x)\,\big(Z(x)(f(x) + \gamma) - P(\gamma)\big) &= 0. \notag
\end{align}
$$

The first line pins the accumulator to $1$ at group starts, the second multiplies in one cell per step, the third checks the finished product hits the public target. These are polynomial identities that must hold on $H$ — precisely the "zero on the whole domain" situation the [batching post]({% post_url 2025-11-07-kzg-batching-in-plonk %}) taught us to fold into a single quotient. We aggregate all of them (across the three families) with powers of a challenge $\alpha$, divide by $Z_H$, commit the quotient, and open everything at a random $\zeta$ with batched KZG — [written out in full below](#one-equation).

The result is a constant-size proof — **544 bytes**, independent of grid size — of nine group elements and eight field elements.

## Binding the proof to *this* puzzle

Everything so far proves "$f$ is *some* valid grid." A puzzle prover has to prove a valid completion of *the specific puzzle on screen*. The revealed clues are public input, and I bind them the Plonk public-input way. Let $S = \lbrace (i, v_i) \rbrace$ be the clue cells and define two public polynomials

$$
q_{\mathsf{clue}}(X) = \sum_{i \in S} L_i(X), \qquad c(X) = \sum_{i \in S} v_i\, L_i(X),
$$

then add one more constraint to the aggregation:

$$
q_{\mathsf{clue}}(X)\,\big(f(X) - c(X)\big) \equiv 0 \pmod{Z_H(X)}.
$$

On a clue cell this forces $f = v_i$; off the clue cells $q_{\mathsf{clue}}$ is zero and it says nothing. What I like about it is the cost: it only touches $f(\zeta)$, which we already open, so it adds **no** commitment, **no** opening, and **no** blinder — proof sizes don't move. The verifier never takes $q_{\mathsf{clue}}(\zeta)$ or $c(\zeta)$ from the prover; it computes both itself in $O(\lvert S\rvert)$ from the barycentric form

$$
L_i(\zeta) = \frac{\omega^{i}}{N} \cdot \frac{\zeta^{N} - 1}{\zeta - \omega^{i}}
$$

with one batched inversion. And because the clue set is absorbed into the Fiat–Shamir transcript *before* any challenge is drawn, the whole proof is cryptographically tied to the instance: an honest proof for one puzzle fails against any other, even a different puzzle the same solution happens to satisfy. Proofs are not replayable across instances.

## Everything, in one equation {#one-equation}

We now have all the pieces, so let's write down what is actually being proved. Put $\bar f(X) = f(X) + \gamma$, and for a family $\mathcal{F}$ with step shifts $\sigma_0,\dots,\sigma_{m-1}$ collect that family's constraints into

$$
\begin{align}
C_{\mathcal{F}}(X) \;=\;\;& q^{\mathcal{F}}_{\mathsf{start}}(X)\,\big(Z_{\mathcal{F}}(X) - 1\big) \notag \\
+\;\;& \sum_{v=0}^{m-1} \alpha^{\,v+1}\, q^{\mathcal{F}}_{\mathsf{step},v}(X)\,\big(Z_{\mathcal{F}}(\sigma_v X) - Z_{\mathcal{F}}(X)\,\bar f(X)\big) \notag \\
+\;\;& \alpha^{\,m+1}\, q^{\mathcal{F}}_{\mathsf{end}}(X)\,\big(Z_{\mathcal{F}}(X)\,\bar f(X) - P(\gamma)\big). \notag
\end{align}
$$

Rows step only by $\sigma_0 = \omega$ and columns only by $\sigma_0 = \omega^{p}$, so each contributes three constraints; boxes step by both $\sigma_0 = \omega$ and $\sigma_1 = \omega^{\,p-k+1}$ and contribute four. Stack the three families and the clue constraint with further powers of $\alpha$, and the entire argument is the single claim that

$$
C_{\mathsf{row}}(X) + \alpha^{3}\,C_{\mathsf{col}}(X) + \alpha^{6}\,C_{\mathsf{box}}(X) + \alpha^{10}\,q_{\mathsf{clue}}(X)\big(f(X) - c(X)\big) \;=\; q(X)\,Z_H(X).
$$

That is the whole prover: eleven constraints, one identity, one quotient. Because $\alpha$ is drawn only after $f$ and the three accumulators are committed, a prover who violates any one of the eleven cannot hope for the aggregation to cancel it — that happens with probability $O(1)/\lvert\mathbb{F}\rvert$ over $\alpha$. Divisibility by $Z_H$ is the "zero on the whole domain" claim from the batching post, so it is checked at a single random point $\zeta$:

$$
C_{\mathsf{row}}(\zeta) + \alpha^{3}\,C_{\mathsf{col}}(\zeta) + \alpha^{6}\,C_{\mathsf{box}}(\zeta) + \alpha^{10}\,q_{\mathsf{clue}}(\zeta)\big(f(\zeta) - c(\zeta)\big) \stackrel{?}{=} q(\zeta)\,\big(\zeta^{N} - 1\big).
$$

Notice how little of this the verifier takes on faith. Every selector, the target $P(\gamma)$, the clue polynomials $q_{\mathsf{clue}}(\zeta)$ and $c(\zeta)$, and $Z_H(\zeta) = \zeta^{N}-1$ it computes itself from public data. It does not even need to be told $q(\zeta)$: the equation above *determines* it, so the verifier divides rather than asking. That leaves eight field elements coming from the prover:

$$
f(\zeta),\;\; Z_{\mathsf{row}}(\zeta),\;\; Z_{\mathsf{col}}(\zeta),\;\; Z_{\mathsf{box}}(\zeta),\;\; Z_{\mathsf{row}}(\omega\zeta),\;\; Z_{\mathsf{box}}(\omega\zeta),\;\; Z_{\mathsf{col}}(\omega^{p}\zeta),\;\; Z_{\mathsf{box}}(\omega^{\,p-k+1}\zeta).
$$

And nothing so far forces those eight numbers to be honest — that is what the commitments are for. The evaluations fall into four groups by the point they are opened at — $f$, the three accumulators and the quotient at $\zeta$; the row and column accumulators once more at their own shifted point; the box accumulator at both of its shifted points — so the prover sends one witness per point: for point $z$ opening polynomials $p_0, p_1, \dots$, it commits the witness of their random linear combination in powers of a final challenge $u$, and the verifier checks

$$
e\Big(\textstyle\sum_i u^{i}\,[p_i(x)]_ 1 - \big(\textstyle\sum_i u^{i}\,p_i(z)\big)[1]_ 1,\;\; [1]_ 2\Big) \stackrel{?}{=} e\big([W_z(x)]_ 1,\;\; [x]_ 2 - z[1]_ 2\big).
$$

This is exactly the pairing check from the batching post, with the left-hand commitment now assembled by the verifier out of the commitments it was given and the evaluations it was told. It holds only if that combination genuinely vanishes at $z$ — and since $u$ is drawn after the evaluations are fixed, that forces *every* claimed evaluation in the group to be correct. Four points, four witnesses — but not four pairing checks: every instance pairs against the same two fixed $\mathbb{G}_ 2$ elements, so one more challenge folds all four into a single two-term pairing product. Those four witnesses plus the five commitments are precisely the nine group elements of the 544-byte proof. Exactly which polynomial is committed when, opened where, and which $p_i$ enters which of the four checks is pinned down in the [full specification below](#protocol).

## The protocol, in full {#protocol}

Everything above with nothing left implicit — enough to reimplement. $\mathbb{F}$ is the BN254 scalar field, $\mathbb{G}_ 1,\mathbb{G}_ 2$ its pairing groups, $[y]_ 1$ a commitment, $x$ the SRS secret.

### 0. Public parameters

$$
k = \sqrt{n},\qquad
p = 2^{\lceil \log_2 n\rceil},\qquad
N = p^{2},\qquad
H = \langle\omega\rangle,\ \lvert H\rvert = N,\qquad
Z_H(X) = X^{N}-1
$$

$$
K = \lbrace g\,\nu^{\,j}\rbrace_{j<4N},\quad \nu \text{ of order } 4N,\quad g \text{ a generator of } \mathbb{F}^{\times},\quad\text{so } K \cap H = \varnothing
$$

$$
\mathrm{SRS} = \big(\lbrace [x^{i}]_ 1\rbrace_{i=0}^{4N},\; [1]_ 2,\; [x]_ 2\big)
$$

Cell $(r,c)$ sits at domain index $\mathrm{idx}(r,c) = pr + c$. The three families, as index sets in traversal order, for $0 \le j < n$:

$$
\begin{align}
\mathcal{G}^{\mathsf{row}}_{r}[j] &= pr + j, \qquad &\sigma^{\mathsf{row}}_{0} &= \omega \notag \\
\mathcal{G}^{\mathsf{col}}_{c}[j] &= pj + c, \qquad &\sigma^{\mathsf{col}}_{0} &= \omega^{p} \notag \\
\mathcal{G}^{\mathsf{box}}_{b}[j] &= p\big(k\lfloor b/k\rfloor + \lfloor j/k\rfloor\big) + k\,(b \bmod k) + (j \bmod k), \qquad &\sigma^{\mathsf{box}}_{0} &= \omega,\ \ \sigma^{\mathsf{box}}_{1} = \omega^{\,p-k+1} \notag
\end{align}
$$

Rows and columns always take variant $0$; boxes take variant $v(j) = 1$ when $j \bmod k = k-1$ (the box-row wrap) and $0$ otherwise. Selectors are the $H$-interpolants of the indicator vectors, over all groups $\mathcal{G}$ of the family, zero everywhere else:

$$
q^{\mathcal{F}}_{\mathsf{start}}\big(\omega^{\mathcal{G}[0]}\big) = 1,
\qquad
q^{\mathcal{F}}_{\mathsf{step},v}\big(\omega^{\mathcal{G}[j]}\big) = 1 \ \ (j < n-1,\ v(j) = v),
\qquad
q^{\mathcal{F}}_{\mathsf{end}}\big(\omega^{\mathcal{G}[n-1]}\big) = 1
$$

Instance-dependent, both sides: with $S = \lbrace (i, v_i)\rbrace$ the clues at domain indices,

$$
P(\gamma) = \prod_{i=1}^{n}(i+\gamma),
\qquad
q_{\mathsf{clue}} = \sum_{i \in S} L_i,
\qquad
c = \sum_{i \in S} v_i L_i
$$

### 1. Transcript

SHA-256 over a running state $\mathrm{st}$, initialised with the domain separator `"sudoku-shuffle"`:

$$
\begin{align}
\mathsf{absorb}(\ell, m) &:\quad \mathrm{st} \mathrel{\Vert}= \ell \mathrel{\Vert} m \notag \\
\mathsf{challenge}(\ell) &:\quad \mathrm{st} \mathrel{\Vert}= \ell; \quad d \leftarrow \mathrm{SHA256}(\mathrm{st}); \quad \mathrm{st} \mathrel{\Vert}= d; \quad \textbf{return } \mathrm{Fr}_{\mathrm{le}}(d) \bmod r \notag
\end{align}
$$

Group elements are absorbed compressed (32 B), scalars little-endian (32 B), integers as `u64` little-endian. The order is fixed and total:

| # | operation | label | data |
| --- | --- | --- | --- |
| 1 | absorb | `"n"` | $n$ |
| 2 | absorb | `"puzzle"` | all $n^2$ clue cells, $0$ for hidden |
| 3 | absorb | `"f"` | $[f(x)]_ 1$ |
| 4 | **challenge** | `"gamma"` | $\rightarrow \gamma$ |
| 5 | absorb | `"zr"`, `"zc"`, `"zb"` | $[Z_{\mathsf{row}}(x)]_ 1$, $[Z_{\mathsf{col}}(x)]_ 1$, $[Z_{\mathsf{box}}(x)]_ 1$ |
| 6 | **challenge** | `"alpha"` | $\rightarrow \alpha$ |
| 7 | absorb | `"q"` | $[q(x)]_ 1$ |
| 8 | **challenge** | `"zeta"` | $\rightarrow \zeta$ |
| 9 | absorb | `"f_z"`, `"zr_z"`, `"zc_z"`, `"zb_z"`, `"q_z"`, `"zr_w"`, `"zb_w"`, `"zc_wp"`, `"zb_wb"` | the nine evaluations, in that order — but `q_z` is *derived*, not sent (§3) |
| 10 | **challenge** | `"u"` | $\rightarrow u$ — batches openings at one point |
| 11 | absorb | `"w_z"`, `"w_w"`, `"w_wp"`, `"w_wb"` | the four opening witnesses |
| 12 | **challenge** | `"v"` | $\rightarrow v$ — batches across points |

Absorbing the puzzle at step 2 — before any challenge — is what binds the proof to the instance.

### 2. Prover

**Round 1.** With $\mathbf{f}[\mathrm{idx}(r,c)] = \text{cell}(r,c)$ and $\mathbf{f} = 0$ on padding, and $b_i \leftarrow \mathbb{F}$ fresh:

$$
f(X) = \mathrm{IFFT}_ H(\mathbf{f}) + \Big(\sum_{i=0}^{1} b_i X^{i}\Big) Z_H(X),
\qquad
[f(x)]_ 1 = \sum_{i} f_i\,[x^{i}]_ 1
$$

**Round 2.** Per family, per group, walking the traversal ($\mathbf{z} = 1$ off-group):

$$
\mathbf{z}\big[\mathcal{G}[0]\big] = 1,
\qquad
\mathbf{z}\big[\mathcal{G}[j+1]\big] = \mathbf{z}\big[\mathcal{G}[j]\big]\cdot\big(\mathbf{f}\big[\mathcal{G}[j]\big] + \gamma\big)
$$

$$
Z_{\mathcal{F}}(X) = \mathrm{IFFT}_ H(\mathbf{z}) + \Big(\sum_{i} b_i X^{i}\Big) Z_H(X)
$$

with the blinder running over $i < 3$ for rows and columns and $i < 4$ for boxes — always one more than the number of points that polynomial gets opened at.

**Round 3.**

$$
q(X) = \frac{C_{\mathsf{row}}(X) + \alpha^{3}C_{\mathsf{col}}(X) + \alpha^{6}C_{\mathsf{box}}(X) + \alpha^{10}\,q_{\mathsf{clue}}(X)\big(f(X)-c(X)\big)}{Z_H(X)},
\qquad \deg q \approx 2N
$$

computed in evaluation form on the coset $K$:[^coset] one size-$4N$ coset FFT each for $f$, the three $Z_{\mathcal{F}}$, the shifted $Z_{\mathcal{F}}(\sigma_v X)$ (scale coefficient $i$ by $\sigma_v^{\,i}$), the selectors, $q_{\mathsf{clue}}$ and $c$; combine pointwise; scale by $Z_H^{-1}$, which is four precomputed values indexed by $j \bmod 4$;[^zh] inverse coset FFT back to coefficients.

**Round 4.** Eight evaluations — everything but $q(\zeta)$, which the verifier reconstructs:

$$
f(\zeta),\;\; Z_{\mathsf{row}}(\zeta),\;\; Z_{\mathsf{col}}(\zeta),\;\; Z_{\mathsf{box}}(\zeta),\;\; Z_{\mathsf{row}}(\omega\zeta),\;\; Z_{\mathsf{box}}(\omega\zeta),\;\; Z_{\mathsf{col}}(\omega^{p}\zeta),\;\; Z_{\mathsf{box}}(\omega^{\,p-k+1}\zeta)
$$

The transcript still absorbs $q(\zeta)$ in position five; both sides have it, one by evaluation and one by division.

**Round 5.** One witness per distinct opening point, batching everything opened there with powers of $u$:

$$
W_z(X) = \frac{\sum_i u^{i}\,p^{(z)}_i(X) \;-\; \sum_i u^{i}\,p^{(z)}_i(z)}{X - z}
$$

$$
\begin{align}
p^{(\zeta)} &= \big(f,\; Z_{\mathsf{row}},\; Z_{\mathsf{col}},\; Z_{\mathsf{box}},\; q\big) \notag \\
p^{(\omega\zeta)} &= \big(Z_{\mathsf{row}},\; Z_{\mathsf{box}}\big) \notag \\
p^{(\omega^{p}\zeta)} &= \big(Z_{\mathsf{col}}\big) \notag \\
p^{(\omega^{\,p-k+1}\zeta)} &= \big(Z_{\mathsf{box}}\big) \notag
\end{align}
$$

The four witnesses then go into the transcript and yield the last challenge $v$, which exists purely to fold the four opening checks into one.

The proof is exactly this, in this order on the wire:

$$
\begin{align}
\pi \;=\; \Big(\;
& [f(x)]_1,\;\; [Z_{\mathsf{row}}(x)]_1,\;\; [Z_{\mathsf{col}}(x)]_1,\;\; [Z_{\mathsf{box}}(x)]_1,\;\; [q(x)]_1, && \text{the five commitments} \notag \\[2pt]
& f(\zeta),\;\; Z_{\mathsf{row}}(\zeta),\;\; Z_{\mathsf{col}}(\zeta),\;\; Z_{\mathsf{box}}(\zeta), && p^{(\zeta)} \text{ at } \zeta,\ \text{except } q(\zeta) \notag \\[2pt]
& Z_{\mathsf{row}}(\omega\zeta),\;\; Z_{\mathsf{box}}(\omega\zeta), && p^{(\omega\zeta)} \text{ at } \omega\zeta \notag \\[2pt]
& Z_{\mathsf{col}}(\omega^{p}\zeta), && p^{(\omega^{p}\zeta)} \text{ at } \omega^{p}\zeta \notag \\[2pt]
& Z_{\mathsf{box}}(\omega^{\,p-k+1}\zeta), && p^{(\omega^{\,p-k+1}\zeta)} \text{ at } \omega^{\,p-k+1}\zeta \notag \\[2pt]
& [W_{\zeta}(x)]_1,\;\; [W_{\omega\zeta}(x)]_1,\;\; [W_{\omega^{p}\zeta}(x)]_1,\;\; [W_{\omega^{\,p-k+1}\zeta}(x)]_1
\;\Big) && \text{one } W_z \text{ per point} \notag
\end{align}
$$

Lines two through five list each $p^{(z)}$ evaluated at its own $z$, for the four points in turn — so the eight scalars are not an arbitrary count. They are the four tuple sizes $5 + 2 + 1 + 1$, less the one value the verifier can reconstruct for itself. Nine compressed points plus eight scalars is $9 \times 32 + 8 \times 32 = 544$ bytes.

Commitments first, evaluations next, witnesses last — the transcript order of §1 is *not* the serialization order, since $u$ cannot be drawn until the evaluations have been absorbed.

### 3. Verifier

Replay the transcript to recover $\gamma, \alpha, \zeta, u$, then two checks.

**Check 1 — reconstruct $q(\zeta)$.** Evaluate the eleven selectors at $\zeta$, compute $P(\gamma)$ in $n$ multiplications, and get the clue values in $O(\lvert S\rvert)$ with one batched inversion:

$$
q_{\mathsf{clue}}(\zeta) = \sum_{i \in S} L_i(\zeta),
\qquad
c(\zeta) = \sum_{i \in S} v_i L_i(\zeta),
\qquad
L_i(\zeta) = \frac{\omega^{i}}{N}\cdot\frac{\zeta^{N}-1}{\zeta-\omega^{i}}
$$

Then with $\bar f = f(\zeta) + \gamma$, and every other quantity below taken verbatim from the proof:

$$
\begin{align}
q(\zeta)\,\big(\zeta^{N}-1\big) \;=\;\;
 & q^{\mathsf{row}}_{\mathsf{start}}(\zeta)\big(Z_{\mathsf{row}}(\zeta) - 1\big) \notag \\
+\;& \alpha\;\, q^{\mathsf{row}}_{\mathsf{step},0}(\zeta)\big(Z_{\mathsf{row}}(\omega\zeta) - Z_{\mathsf{row}}(\zeta)\,\bar f\big) \notag \\
+\;& \alpha^{2} q^{\mathsf{row}}_{\mathsf{end}}(\zeta)\big(Z_{\mathsf{row}}(\zeta)\,\bar f - P(\gamma)\big) \notag \\
+\;& \alpha^{3} q^{\mathsf{col}}_{\mathsf{start}}(\zeta)\big(Z_{\mathsf{col}}(\zeta) - 1\big) \notag \\
+\;& \alpha^{4} q^{\mathsf{col}}_{\mathsf{step},0}(\zeta)\big(Z_{\mathsf{col}}(\omega^{p}\zeta) - Z_{\mathsf{col}}(\zeta)\,\bar f\big) \notag \\
+\;& \alpha^{5} q^{\mathsf{col}}_{\mathsf{end}}(\zeta)\big(Z_{\mathsf{col}}(\zeta)\,\bar f - P(\gamma)\big) \notag \\
+\;& \alpha^{6} q^{\mathsf{box}}_{\mathsf{start}}(\zeta)\big(Z_{\mathsf{box}}(\zeta) - 1\big) \notag \\
+\;& \alpha^{7} q^{\mathsf{box}}_{\mathsf{step},0}(\zeta)\big(Z_{\mathsf{box}}(\omega\zeta) - Z_{\mathsf{box}}(\zeta)\,\bar f\big) \notag \\
+\;& \alpha^{8} q^{\mathsf{box}}_{\mathsf{step},1}(\zeta)\big(Z_{\mathsf{box}}(\omega^{\,p-k+1}\zeta) - Z_{\mathsf{box}}(\zeta)\,\bar f\big) \notag \\
+\;& \alpha^{9} q^{\mathsf{box}}_{\mathsf{end}}(\zeta)\big(Z_{\mathsf{box}}(\zeta)\,\bar f - P(\gamma)\big) \notag \\
+\;& \alpha^{10} q_{\mathsf{clue}}(\zeta)\big(f(\zeta) - c(\zeta)\big) \notag
\end{align}
$$

Read left to right this is a *definition*, not a comparison: divide by $\zeta^{N}-1$ and you have $q(\zeta)$, the ninth evaluation, without the prover sending it. (If $\zeta^{N} = 1$, reject — but $\zeta \in H$ happens with probability $N/\lvert\mathbb{F}\rvert$.) All the force has moved into Check 2, which now has to establish that the *committed* $q$ really opens to this number.

**Check 2 — the openings.** Clearing the denominator in the Round 5 definition of $W_z$, the openings are honest exactly when

$$
\sum_i u^{i}\,\big(p^{(z)}_ i(X) - p^{(z)}_ i(z)\big) \;=\; W_z(X)\,(X-z).
$$

The verifier holds none of the $p^{(z)}_ i$, but it does not need them. Commitment is linear and a scalar $v$ commits to $v[1]_ 1$, so the left side can be committed straight from the proof — commitments for the first term, claimed evaluations for the second — and the pairing tests the identity at the secret $x$:

$$
e\Big(\textstyle\sum_i u^{i}\big[p^{(z)}_i(x)\big]_1 - \big(\textstyle\sum_i u^{i} p^{(z)}_i(z)\big)[1]_1,\;\; [1]_2\Big)
\;\stackrel{?}{=}\;
e\big([W_z(x)]_1,\;\; [x]_2 - z\,[1]_2\big)
$$

At $z = \zeta$, whose tuple is all five committed polynomials, that reads:

$$
\begin{align}
e\Big(\;& [f(x)]_1 + u\,[Z_{\mathsf{row}}(x)]_1 + u^{2}[Z_{\mathsf{col}}(x)]_1 + u^{3}[Z_{\mathsf{box}}(x)]_1 + u^{4}[q(x)]_1 \notag \\
&-\big(f(\zeta) + u\,Z_{\mathsf{row}}(\zeta) + u^{2}Z_{\mathsf{col}}(\zeta) + u^{3}Z_{\mathsf{box}}(\zeta) + u^{4}q(\zeta)\big)[1]_1,\;\; [1]_2\Big) \notag \\
&\stackrel{?}{=}\; e\big([W_{\zeta}(x)]_1,\;\; [x]_2 - \zeta\,[1]_2\big) \notag
\end{align}
$$

and at $z = \omega^{p}\zeta$, whose tuple is the single polynomial $Z_{\mathsf{col}}$, it degenerates to a plain KZG opening:

$$
e\big([Z_{\mathsf{col}}(x)]_1 - Z_{\mathsf{col}}(\omega^{p}\zeta)\,[1]_1,\;\; [1]_2\big)
\;\stackrel{?}{=}\;
e\big([W_{\omega^{p}\zeta}(x)]_1,\;\; [x]_2 - \omega^{p}\zeta\,[1]_2\big)
$$

**Fold the four into one.** Taken literally that is four equations and eight pairings, and it is wasteful: the $\mathbb{G}_ 2$ arguments differ only by the scalar $z$. Split the right-hand side by bilinearity,

$$
e\big([W_z(x)]_1,\;\; [x]_2 - z\,[1]_2\big)
\;=\;
e\big([W_z(x)]_1,\;\; [x]_2\big)\cdot e\big({-z}\,[W_z(x)]_1,\;\; [1]_2\big),
$$

and move the second factor left. Writing $L_z$ for the $\mathbb{G}_ 1$ element on the left of the check above, every instance now pairs against the *same* two fixed $\mathbb{G}_ 2$ points:

$$
e\big(L_z + z\,[W_z(x)]_1,\;\; [1]_2\big) \;\stackrel{?}{=}\; e\big([W_z(x)]_1,\;\; [x]_2\big)
$$

so one random $v$ collapses all four of them into a single equation:

$$
e\Big(\textstyle\sum_{j} v^{\,j}\big(L_{z_j} + z_j\,[W_{z_j}(x)]_1\big),\;\; [1]_2\Big)
\;\stackrel{?}{=}\;
e\Big(\textstyle\sum_{j} v^{\,j}\,[W_{z_j}(x)]_1,\;\; [x]_2\Big)
$$

Two pairings for all four points, evaluated as one two-term product so they also share a single final exponentiation. The cost is about ten extra $\mathbb{G}_ 1$ scalar multiplications, perhaps a twentieth of one pairing. $v$ **must** be drawn after the witnesses are in the transcript — if the prover knew $v$ first it could fit witnesses to the combination without satisfying any individual check.

Accept iff that one equation holds.

## A word on zero knowledge

To keep the hidden cells hidden, every witness-dependent polynomial carries Plonk-style blinders: a polynomial opened at $m$ points is committed as $p(X) + b(X) Z_H(X)$ with a random $b$ of degree $m$ — that is, $m+1$ random scalars. The blinders vanish on $H$, so the constraint semantics are untouched, but the off-domain openings the verifier sees become uniformly random and the whole view is simulatable.

That $m+1$ is where the budget goes, and it is worth doing the arithmetic against the eight evaluations the prover sends. Every one of them is an opening of a blinded polynomial: $f$ at one point, $Z_{\mathsf{row}}$ and $Z_{\mathsf{col}}$ at two each, $Z_{\mathsf{box}}$ at three. So the blinding cost is $2 + 3 + 3 + 4 = 12$ scalars — one more per polynomial than it has openings, because the $m$ revealed evaluations consume $m$ degrees of freedom and the last one keeps the commitment itself from being pinned down by them. The quotient needs no blinder: $q(\zeta)$ is never sent, and even the value the verifier reconstructs is a public function of the eight blinded ones, so it carries nothing they don't already.

## How fast is it?

Criterion medians on my laptop, single-threaded:

| grid  | prove   | verify |
| ----- | ------- | ------ |
| 9×9   | 28.2 ms | 1.32 ms |
| 16×16 | 28.2 ms | 1.34 ms |
| 25×25 | 87.3 ms | 1.49 ms |

Proving stays under 100 ms even at $25\times25$, and verification is a flat ~1.4 ms regardless of grid size — the proof is a constant nine group elements and eight field elements no matter how big the puzzle. (The $9\times9$ and $16\times16$ prove times coincide because with the single-commitment layout they share the same domain $N=256$ — the delta is protocol machinery, not padding.)

Nearly all of that verify time is the two Miller loops of the batched opening check. The rest — eleven selector evaluations, the barycentric clue sum, a dozen $\mathbb{G}_ 1$ scalar multiplications — barely registers beside them, which is also why the number hardly moves with $n$. There is not much left to take without changing the layout, and the layout is what fixes the four opening points: rows, columns and boxes need three distinct traversal shifts, and no relabelling of the traversals collapses them into fewer.

## Try it {#try-it}

The prover compiles to WebAssembly and runs entirely in your browser — pick a size, enter a puzzle (or let the built-in solver find a completion), generate a proof, verify it, and try tampering with the clues or the proof bytes to watch verification fail. It proves a $9\times9$ in well under a second client-side.

**[Open the demo →](/assets/sudoku-demo.html)**

One honest caveat printed on the page itself: the demo seeds the KZG setup deterministically so proofs stay shareable across page loads, which makes that particular setup a forgeable toy — a real deployment would use a proper ceremony SRS.

## Conclusion

Sudoku is small, but the structure it exposes is not. "Many small, structured, exact-multiplicity constraints over one shared witness" is the shape of range decompositions, permutation networks, and state-machine transitions too. The lesson I take is that when the target multiset is a fixed little set like $\lbrace 1,\dots,n \rbrace$, you don't need the full strength of a permutation argument: deleting the coordinate binding from Plonk's permutation product — turning it into a hidden shuffle — collapses the right-hand side to a public scalar, and the single-commitment traversal layout and the zero-cost clue binding sit naturally on top.

## References

{% bibliography --cited %}

## Footnotes

[^coset]: The division cannot be done on $H$ itself: there $Z_H$ vanishes by construction and so does the numerator, so every point reads $0/0$. $K$ is a coset of a larger power-of-two subgroup — power-of-two so that radix-2 FFT still applies, and shifted by a generator $g$ of $\mathbb{F}^{\times}$ so no point of $K$ can land in $H$ (a generator lies in no proper subgroup, and $H \subseteq \langle\nu\rangle$). Size $4N$ is the smallest power of two above the numerator's degree, which reaches about $3N$: selector $\times\, Z \times f$, all blinded.

[^zh]: At the $j$-th point of $K$, $Z_H(g\nu^{\,j}) = (g\nu^{\,j})^{N} - 1 = g^{N}(\nu^{N})^{j} - 1$. Since $\nu$ has order $4N$, $\nu^{N}$ is a primitive 4th root of unity, so $(\nu^{N})^{j}$ depends only on $j \bmod 4$ and $Z_H$ takes just four distinct values across all $4N$ points. One batch inversion of those four replaces $4N$ field inversions — 4 instead of 1024 for a $9\times9$.
