# -*- coding: utf-8 -*-
def lin(c):
    c = c/255.0
    return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4

def L(hexs):
    h = hexs.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)

def ratio(a,b):
    la, lb = L(a), L(b)
    hi, lo = max(la,lb), min(la,lb)
    return (hi+0.05)/(lo+0.05)

pairs = [
 ("#5D6B74", "#FFFFFF"), ("#5D6B74", "#202931"), ("#5D6B74", "#1A2126"),
 ("#6C7A83", "#FFFFFF"), ("#6C7A83", "#202931"),
 ("#8C9AA4", "#202931"), ("#8C9AA4", "#FFFFFF"),
 ("#CC5E3A", "#FFFFFF"), ("#CC5E3A", "#202931"),
 ("#DE7B4F", "#202931"), ("#DE7B4F", "#FFFFFF"),
 ("#93A1AA", "#1A2126"), ("#93A1AA", "#202931"),
 ("#5D6B74", "#EEF1F3"),
]
for f, b in pairs:
    print(f, "on", b, "=", round(ratio(f,b),2))
