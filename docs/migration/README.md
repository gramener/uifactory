---
nav_exclude: true
---

# Migration

## UIFactory v1.0

To migrate your component from UIFactory v0.x to v1.x, make these changes in your component (where applicable):

1. Replace `<template component="...">` with `<template $name="...">`
2. Replace `<template @render:js="...">` with `<template $render:js="...">`
3. Replace `this` with `this.$contents`
4. Replace `$target` with `this`
5. Replace `this.data` with `this.$data`
6. Replace `this.ui.ready` with `this.$ready`
7. Rewrite any `<style scoped>` styles without the scoped attribute -- by prefixing all selectors with `component-name`
8. Rewrite properties specified as `<script type="application/json">` as attributes.
   For example:
   ```html
   <template component="...">
     <script type="application/json">
       { "properties": [ { "name": "list", "type": "array", "value": [] } ] }
     </script>
   </template>
   ```
   should be written as:
   ```html
   <template $name="..." list:array="[]">
   </template>
   ```
9. Rewrite the `properties` in `uifactory.register({properties})` as a dict, not list.
   For example:
   ```js
   uifactory.register({
     properties: [
       { "name": "list", "type": "array", "value": [] }
     ]
   })
   ```
   should be written as:
   ```js
   uifactory.register({
     properties: {
       "list": { "type": "array", "value": [] }
     }
   })
   ```
