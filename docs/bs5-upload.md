# bs5-upload

<!-- TODO: Chandana to write the bs5-upload docs using the same structure -->

`<bs5-upload>` renders an SVG, modifying parts of it based on data using rules.

This is useful when creating:

- Data-driven infographics like [data portraits](https://gramener.com/gramex/guide/workshop/data-portraits/)
- [Coloring maps using data](https://gramener.com/cartogram/)
- Coloring physical layouts like
  - [manufacturing plants](https://gramener.com/processmonitor/monitor)
  - [store layouts](https://gramener.com/store/retail_store_layout)
- Coloring logical workflows like
  - [supply chains](https://gramener.com/store/retail_supply_chain)
  - [process workflows](https://gramener.com/servicerequests/)

## Usage

Add this code anywhere in your HTML page:

```html
<script src="https://cdn.jsdelivr.net/npm/lodash/lodash.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/uifactory@0.0.16/dist/uifactory.min.js" import="@bs5-upload"></script>

<bs5-upload src:urltext="https://cdn.glitch.com/00ca098e-1db3-4b35-aa48-6155f65df538%2Fphone.svg?v=1623937023597"
     data:js="{ phone: 'iPhone', hours: 2.3 }"
     rules:js="{
       '.phone': { fill: data.phone == 'Android' ? 'pink' : 'yellow' },
       '.phone-name': { text: data.phone },
       '.hours': { width: data.hours * 60, fill: 'aqua' },
       '.hours-text': { text: data.hours }
     }"></bs5-upload>
</bs5-upload>
```

This renders the following output:

![bs5-upload phone example output](bs5-upload-phone.svg){.img-fluid}

## Properties

`<bs5-upload>` has 3 properties:

- `src`: [urltext](type-urltext.md) (**required**). The SVG file or URL to render. For example:
  - `src="https://example.org/your.svg"` renders the SVG -- provided
    [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is enabled.
  - `src:string="<svg><rect width='300' height='200' fill='red'></rect></svg>"` treats the
    attribute value as a string (instead of a URL) and renders it as SVG.
  - `src:js="myGlobalSvgString"` renders the SVG in the JavaScript global variable `myGlobalSvgString`
- `rules`: [urljson](type-urljson.md) (optional). The [JSON rules](#rules) to map data to SVG attributes. For example:
  - `rules="https://example.org/rules.json"` applies rules from the JSON file -- if
    [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is enabled.
  - `rules:js="'.phone': { fill: data.phone == 'Android' ? 'pink' : 'yellow' }` defines a rule inline as a JavaScript object
- `data`: [urljson](type-urljson.md) (optional). The data to modify the SVG file.
  - `data="https://example.org/data.json"` loads data from the JSON file -- if
    [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is enabled.
  - `data:js="{ phone: 'iPhone', hours: 2.3 }"` defines the data inline as a JavaScript object
    <!-- TODO: make data:js the default -->

Changing any property re-renders the component. For example:

```js
// Re-render the component with new data
document.querySelector('bs5-upload').data = { phone: 'Android', hours: 2.9}
// Re-render the component with a new SVG that has a tall blue rectangle
document.querySelector('bs5-upload').src = "<svg><rect width='300' height='400' fill='blue'></rect></svg>"
```

## Examples

TODO
