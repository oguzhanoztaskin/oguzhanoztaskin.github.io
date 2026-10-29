---
layout: post
title: "Hybrid VPN: A Swiss Army Knife for Android Networking"
date: 2026-10-29
tags: [android, vpn, networking, llm]
---

I made an Android VPN app because I was tired of managing separate apps for different networking needs. I wanted DNS filtering, access to my devices through Tailscale, OpenVPN for my university network, and an HTTP proxy for debugging. Sometimes I wanted more than one of these active at the same time.

Android gets in the way here: [only one VPN service can be active per user or profile](https://developer.android.com/develop/connectivity/vpn#service). Starting another stops the existing one. A DNS-filtering app can therefore compete for the same slot as Tailscale or OpenVPN, even though I use them for very different purposes.

There were other annoyances too: ads, apps I did not particularly trust, and the battery cost of keeping networking tools running. LLMs had made trying a project like this easy enough that I decided to give it a go. The result is [Hybrid VPN](https://github.com/oguzhanoztaskin/hybrid-vpn), which brings these functions together behind a single Android VPN service.

## DNS filtering

The first feature is a custom DNS resolver with built-in filtering. This is also the part I currently use the most: ad blocking is already good enough for my needs.

An AdGuard sign-up form made me uncomfortable and nudged me toward building something I could configure myself.[^adguard]

I also wanted local DNS filtering without a separate app competing with Tailscale or OpenVPN for the VPN slot. Including it here lets me keep filtering alongside the other connections I need.

## Tailscale

I use Tailscale to connect to my devices, particularly the ones I leave at home. Its Android app needs the VPN slot too, so it was another obvious thing to include.

One use case I like is KDE Connect. I use it for multimedia controls, and I can reach my devices over Tailscale. This is useful on Wi-Fi networks where devices on the same WLAN cannot communicate directly with each other.

Hybrid VPN also includes support for connecting to multiple Tailscale networks, or *tailnets*, at once. I have not tested that feature yet, so for now it is something the app is designed to support rather than something I can personally vouch for.

## OpenVPN

OpenVPN lets me browse through another network. In my case, that network is my university's: connecting through it allows me to access research papers using the university's subscriptions, one of the intended purposes of the connection.

This is another reason I wanted these tools together. Accessing a paper should not mean switching off my DNS filtering or losing access to my devices at home.

## HTTP proxy

The fourth piece is HTTP proxy support. I use mitmproxy from time to time to inspect traffic and debug things, so I added a way to route traffic through it from the same app. Having that option here saves me from going through Android's proxy settings or reaching for another app whenever I need it. Inspecting HTTPS contents still requires the client to trust mitmproxy's certificate, and certificate pinning can prevent interception.

## Battery and development

Battery use mattered to me from the beginning. I asked the coding agent to run benchmarks, identify unnecessary work, and fix the issues it found. The repository includes [benchmark notes and results](https://github.com/oguzhanoztaskin/hybrid-vpn/blob/main/docs/benchmarks/results.md), covering things such as idle wake-ups, CPU use, and throughput. Those are useful indicators, but I do not have a measured battery-life improvement to claim.

The entire app is vibe-coded. I have not read a single line of its code. I directed the development and tried the parts I needed, but that leaves a considerable gap in my understanding of how the implementation works.

LLMs took away much of the work of getting this built. They also let development move faster than I could learn the details, especially with the limited time I had. Much of the challenge would otherwise have been learning Android, a platform I do not often develop for. Being able to get something useful out of the project anyway has been a good experience.

## Where it stands

There are features I have not tested and bugs I know about that I have not fixed. I plan to develop the app as I need it; for now, the ad-blocking feature is doing its job for me.

I am sharing it as an experimental personal project, with all of those limitations. Building it myself has given me control over what I ask it to do, but I have not reviewed the code or established that it deserves more trust than the apps I wanted to replace.

The source is on [GitHub: oguzhanoztaskin/hybrid-vpn](https://github.com/oguzhanoztaskin/hybrid-vpn). The app is provided without warranty, so please use it at your own discretion.

[^adguard]: AdGuard also offers [free public DNS](https://adguard-dns.io/en/public-dns.html) with no account required. On Android 9 and later, you can set `dns.adguard-dns.com` as the Private DNS provider for provider-side ad and tracker filtering, without a VPN app. My reaction was to the sign-up form I encountered; here, I wanted filtering and custom rules handled locally in the same app as my other networking tools.
