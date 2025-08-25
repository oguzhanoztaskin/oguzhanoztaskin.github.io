---
layout: post
title: "SSL Pinning Bypass: SSLContext"
date: 2025-08-25
tags: [android, security, ssl-pinning, frida]
---

In this post, I will explain how to bypass SSL Pinning with [SSLContext](https://developer.android.com/reference/javax/net/ssl/SSLContext) using [Frida](https://frida.re/).

As the injection method, I use dylib injection for the reasons I explain below.

## Split APKs
Nowadays most apps are split APKs, meaning that they are split into different parts: A main APK that contains .dex files and most resources, one for native libraries (config.arm64_v8a.apk), one for each language the app supports (config.en.apk), one for graphics (config.mdpi.apk) etc. Furthermore, sometimes apktool fails on decompiling/recompiling the main APK and in such cases dylib injection is useful. This is because we do not have to change main APK at all (just resign it with our key), we only have to inject the Frida gadget into a library which lies in `config.<arch>.apk`.

## Injecting Frida into a library
First, we decompile `config.<arch>.apk` that contains the libraries. Then we will find a library that is loaded first, like `libreact_render_core.so` or anything else that might work. Then we will use the following script to inject the Frida gadget `libfrida-gadget.so` into it.
```python
import lief, sys

target = sys.argv
libnative = lief.parse(target)
libnative.add_library("libfrida-gadget.so")
libnative.write(target)
```
This adds `libfrida-gadget.so` to the ELF's dynamic section so that our gadget is loaded alongside the target library[^1]. You can check this with the `readelf` command:
```shell
$ readelf -d libreact_render_core.so 

Dynamic section at offset 0x22000 contains 43 entries:
  Tag        Type                         Name/Value
 0x00000001 (NEEDED)                     Shared library: [libfrida.so]
 0x00000001 (NEEDED)                     Shared library: [libjsi.so]
 0x00000001 (NEEDED)                     Shared library: [liblogger.so]
 0x00000001 (NEEDED)                     Shared library: [libreact_config.so]
...
```
This is explained in a much better detail at [here](https://lief.re/doc/stable/tutorials/09_frida_lief.html).

Once the Frida gadget works (the app freezes until I connect to it on startup), I ran the following command, [explained more detailed here]({% post_url 2025-08-25-ssl-pinning-bypass-network-security-config %}#a-note-on-adb-port-forwarding):
```shell
adb forward tcp:27042 tcp:27042
```
This forwards the port 27042 on my computer to the same port on my mobile, where Frida gadget listens by default. I can then connect to the Frida gadget via `frida -R gadget -l ssl.js` and let the script do the bypassing.

[^1]: Sometimes this method silently fails and I haven't figured out why yet. Injecting the Frida gadget into another library often works.

### Frida - SSL Pinning Bypass Script
The `ssl.js` I used above can be found [here](https://codeshare.frida.re/@pcipolloni/universal-android-ssl-pinning-bypass-with-frida/). This script does the following:
- Get `javax.net.ssl.TrustManagerFactory` and use it to create a TrustManager for the certificate at `/data/local/tmp/cert-der.crt`[^2]
- Hook `SSLContext.init` method so that all calls to it are intercepted.
- When `SSLContext.init` is called, instead of the provided TrustManager, use our own that carries mitmproxy's certificate.
Once injected, the script logs its actions in real-time, so you can confirm whether the bypass worked.

And that's it. At this point I am supposed to be able to see the traffic. However I noticed while I can see some, there is still some traffic which I cannot as evident by mitmproxy's logs. Then I realized there was another SSL pinning layer I hadn’t addressed: Network Security Config.

[^2]: This will be the mitmproxy's certificate and we will push it to the device with `adb push mitmproxy.cert /data/local/tmp/cert-der.crt`. This is a directory all apps can access and that's why we are using it. You can find mitmproxy certificates on your computer at `~/.mitmproxy` or your mobile that uses mitmproxy as proxy at `http://mitm.it`.

## Conclusion
In this post, I demonstrated a less known way of injecting Frida by modifying shared libraries, which avoids the common pitfalls of smali recompilation errors. Then we used a Frida script to hook `SSLContext.init` method. I have no practical defense solutions for this attack - Android does not seem to provide a way to see whether SSLContext is initialized with the intended trust manager or not. For a more general defense, detecting whether the gadget is present or not can be used, perhaps by listing the libraries.

**Disclaimer:** This post is intended solely for educational and research purposes. The techniques described here should only be applied to applications you own or have explicit permission to analyze. Reverse engineering, modifying, or intercepting traffic of third-party apps without consent may violate their terms of service and applicable laws. I do not encourage or condone using these methods against third-party apps without permission.