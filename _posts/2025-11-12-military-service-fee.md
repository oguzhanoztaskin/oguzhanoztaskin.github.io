---
layout: post
title: "Paid Military Service Fee in Türkiye"
date: 2025-11-12
tags: [finance, fun, plots]
math_heavy: false
---

Military service is compulsory, yet you can shorten it by paying a [certain fee](https://tr.wikipedia.org/wiki/Bedelli_askerlik) in Türkiye.

And my parents remind me of this biannually because the fee increases every 6 months. They believe it gets more and more expensive over time, but I do not believe so. So I decided to take a closer look at the data to see how the fee performs against various assets and currencies.

**Disclaimer:** This is NOT investment advice. Data, plots, computations, and conclusions may contain errors, and sources may be unreliable. This post is for nothing but fun.

## Goal

Due to various personal circumstances, it's difficult for me to plan exactly when to complete my military service. Therefore, I need to delay it, but every time I do, the fee increases in Turkish Lira. I want to find a currency or asset that rises at least as much as the fee, so that the rise of the fee ceases to be an issue.

The simplest asset to consider is gold. Gold is widely recognized as a store of value and hedge against currency devaluation. Therefore, I want to create plots that show how the paid military service fee performs against gold prices over time.

## Implementation

Wikipedia provides both TL and USD prices for the military service fee, and the Central Bank of Türkiye (TCMB) allows exporting [gold prices](https://evds2.tcmb.gov.tr/index.php?/evds/serieMarket/collapse_25/5849/DataGroup/turkish/bie_mkaltytl/) into an Excel file. Using Python, it's straightforward to generate comparative graphs.

Below, I present 5 plots that convert the military service fee into other currencies and assets over time, plus one plot illustrating the Turkish Lira's depreciation against the USD in recent years, which might explain the difference in the fee vs TL and the fee vs USD.

![Military Service Fee Analysis](/assets/paid-military-service-fee-plots-2025-H2.png)

## Conclusion

I will stick with the gold.