---
layout: "post"
title: "Install Microsoft fonts in Ubuntu"
categories: guide ubuntu it
---
<img src="/assets/fonts.png" alt="Microsoft Fonts" class="banner"/>

Need to generate a PDF using the Arial font? Ubuntu doesn't bundle proprietary software to avoid licensing issues, however you can easily install the Microsoft suite of fonts with one simple command.
<!--more-->

```bash
sudo apt install ttf-mscorefonts-installer
sudo fc-cache -f -v
```


## That's it!

By running this one simple command you will install all these fonts on Ubuntu! Most importantly you will install Arial, the most common Helvetica substitute.

1. Andale Mono
2. Arial Black
3. Arial (Bold, Italic, Bold Italic)
4. Comic Sans MS (Bold)
5. Courier New (Bold, Italic, Bold Italic)
6. Georgia (Bold, Italic, Bold Italic)
7. Impact
8. Times New Roman (Bold, Italic, Bold Italic)
9. Trebuchet (Bold, Italic, Bold Italic)
10. Verdana (Bold, Italic, Bold Italic)
11. Webdings

