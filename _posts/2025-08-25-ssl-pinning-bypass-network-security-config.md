---
layout: post
title: "SSL Pinning Bypass: Network Security Config"
date: 2025-08-25
tags: [android, security, ssl-pinning, mitmproxy]
---

In this post, I will talk about how I bypassed the simplest SSL pinning method: [Network Security Config](https://developer.android.com/privacy-and-security/security-config) via APK resource editing. I will also explain my setup.

I assume you know how to use the tools mitmproxy, an Android proxy client, apktool, adb and do not detail it here.

## Why Do This At All?
SSL Pinning protects your apps their network protocols revealed. Though it is a client side protection and you should focus on server side for the most part, it is still relevant: This will slow down anyone that wants to learn your API, bot it or cheat it.

Studying SSL pinning bypasses is both a fun technical challenge and a way to better understand app defenses. My personal goal here is to observe app traffic directly in mitmproxy, while learning how different protections work.

## Bypassing Network Security Config
Bypassing Network Security Config was simple:
- Decompile the APK with [apktool](https://apktool.org/) 
- Find the name of the config from `AndroidManifest.xml` in the `application` tag as the value of `android:networkSecurityConfig`, usually it is `res/xml/network_security_config.xml`
- then set it to be:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
```
This will make it trust installed certificates - including the [mitmproxy](https://www.mitmproxy.org/)'s certificate if installed. Also if there was any certificate pinned this way, we effectively erased it.[^1]

We can see that the default setting is to only trust system certificates and no cleartext traffic, for API level 28 and higher according to [here](https://developer.android.com/privacy-and-security/security-config). Therefore, adding user certificates as a trust anchor is necessary.

After this, we can build and sign the app and install it on the target device. Next, we need to put the app's network traffic through mitmproxy to observe it.

[^1]: Actually I used a script for this and it did not remove the domain-configs and pin-sets, it just added this base-config after them. I thought bypass would fail because pin-set tags would override the base-config, yet it works.

## Setting up the Proxy
We need to run mitmproxy on the host and configure the target device to use it. However, the host and the target device possibly lie on different networks and cannot see each other. We cannot make the target device connect to mitmproxy then. I assume a USB connection to the target device is present, so I will use adb to make the devices connect. In the next subsection I explain how.

### A Note on ADB Port Forwarding
ADB has two useful commands for port forwarding, the second one is something I wish I had seen sooner[^2]. Here I detail them:
```shell
adb forward tcp:7777 tcp:8888
```
This forwards the port 7777 on the host (i.e. the device running adb, your computer) to the port 8888 on the target device (i.e. your mobile which is connected using a USB cable maybe). What this means is, any connection to port 7777 on your host will be directed to the port 8888 on your target device. For example, if you have an HTTP server listening on port 8888 on your target device, you can access it on your computer via `localhost:7777`.

The other command I wish I had learned sooner is the `adb reverse` command.
```shell
adb reverse tcp:3333 tcp:4444
```
This does the opposite of the `adb forward` command as the name suggests: The port 3333 on the target device is forwarded to the port 4444 on the host device. That is, if you host the HTTP server on your host at 4444, you can access it on your mobile via `localhost:3333`.

Mitmproxy listens at 8080 by default, so we are going to do
```shell
adb reverse tcp:8080 tcp:8080
```
Now we can run a http proxy app on the target device and connect it to `127.0.0.1:8080` so that it connects to the mitmproxy. Then you should be able to see the network traffic.

[^2]:https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/master/docs/user/adb.1.md

## Conclusion
We saw how easy it is to bypass the Network Security Config. All we needed to do was decompile, change an XML file, and recompile. To defend against modification of the APK, one can harden their APK using special tools that make apktool fail.

**Disclaimer:** This post is intended solely for educational and research purposes. The techniques described here should only be applied to applications you own or have explicit permission to analyze. Reverse engineering, modifying, or intercepting traffic of third-party apps without consent may violate their terms of service and applicable laws. I do not encourage or condone using these methods against third-party apps without permission.