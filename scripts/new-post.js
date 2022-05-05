#!/usr/bin/env node
const fs = require('fs');
const slugify = require('slug');
const dateFns = require('date-fns');

const title = process.argv[2];

if (!title) {
  console.error('a title is required!');
  process.exit(1);
}

const slug = slugify(title.toLowerCase());
const date = dateFns.format(new Date(), 'yyyy-MM-dd');
const file = `./src/posts/${date}-${slug}.md`;

fs.writeFile(
  file,
  `---
layout: post
title: "${title}"
date: ${date}
tags:
  - post
---`,
  function (err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`${date}-${slug}.md was created!`);
    process.exit();
  }
);
