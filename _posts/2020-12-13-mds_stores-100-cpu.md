---
layout: "post"
title: "Fix MacOS mds_stores taking 100% cpu"
categories: macos it
---
<img src="/assets/mds-stores.jpg" alt="mds_stores" class="banner"/>

When mds_stores takes 100% of cpu it means it's scanning and indexing a directory with a lot of files in it. In
programming, typically node_modules is the culprit.

<!--more-->

## See what Spotlight is doing/indexing

Use this if you aren't a JavaScript developer and you know it's not node_modules folders.

``` bash
sudo fs_usage -w -f filesys mds_stores
```

## Create exclusions for node_modules

This will create .metadata_never_index in the root of all node_modules folders to exclude them from spotlight.

``` bash
find . -type d -path './.*' -prune -o -path './Pictures*' -prune -o -path './Library*' -prune -o -path '*node_modules/*' -prune -o -type d -name 'node_modules' -exec touch '{}/.metadata_never_index' \; -print
```

## Using the alias option

If you find yourself doing it frequently you can create a bash alias like so:

``` bash
alias fix-spotlight="find . -type d -path './.*' -prune -o -path './Pictures*' -prune -o -path './Library*' -prune -o -path '*node_modules/*' -prune -o -type d -name 'node_modules' -exec touch '{}/.metadata_never_index' \; -print"
fix-spotlight
```