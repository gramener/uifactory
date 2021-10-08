# UIFactory versions

- 1.21.0 (4 Oct 2021):
  - `<attr>:="..."` [dynamically sets attributes based on value](#add-dynamic-classes-and-styles-with-)
- 1.20.0 (28 Sep 2021):
  - `<script type="text/html" $block="name">` adds a [re-usable template block](#add-re-usable-blocks-with-script-typetexthtml-block)
  - `this.$id` holds a [unique ID for each component](#thisid-hold-a-unique-id-for-each-component)
- 1.19.0 (25 Sep 2021):
  - `<script $onevent="selector" $once>` adds [listener to selector, running only once](#add-events-with-script-on)
  - `<style>` is restricted to component with a `component-name` prefix
  - [Network-chart](docs/network-chart.md) published
- 1.18.0 (19 Sep 2021):
  - Major API rewrite. See [migration to v1](docs/migration-v1.md)
  - [Lifecycle events](#lifecycle-events-are-supported)
- 0.0.17 (18 Sep 2021): Remove lodash dependency
- 0.0.16 (1 Sep 2021):
  - `<style scoped>` applies style only to component
  - `el.property = value` re-renders `el`
  - `el.update({'attr:type': ...})` supported
  - `<vega-chart>` component added with signals support
- 0.0.15 (11 Aug 2021): `@render:js` attribute supports [custom renderers](#use-any-renderer)
- 0.0.14 (30 Jun 2021): `<comic-gen>` component added
- 0.0.13 (29 Jun 2021): Minify code into `dist/uifactory.min.js`
- 0.0.12 (25 Jun 2021): [`<slot>` support](#use-slot-in-templates)
- 0.0.11 (17 Jun 2021): [`:urljson`](#fetch-urls-as-json-using-the-urljson-type) and
  [`:urltext`](#fetch-urls-as-text-using-the-urltext-type) types added.
  [`"import=@component-name"` support](#load-components-from-html-files)
- 0.0.10 (9 Jun 2021): `<svg-chart>` component added. `:js` allows properties as variables
- 0.0.9 (2 Jun 2021): The `:url` attribute type [fetches data from a URL](#fetch-urls-using-the-url-type)
- 0.0.8 (27 May 2021): Custom types' `.parse()` receives `this.data` as input
- 0.0.7 (26 May 2021): Allow [custom types](#custom-types-need-a-parse-and-stringify-function)
- 0.0.6 (21 Apr 2021): Allow [property type definitions](#define-properties-using-template-attr)
