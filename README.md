# UIFactory

UIFactory is a small easy-to-learn HTML component library.

- **It's small**. 2 KB minified, gzipped.
- **There's nothing new to learn**. No shadow DOM. No virtual DOM. Just regular HTML, CSS and JS.
- **It's open-source**. [See GitHub](https://github.com/gramener/uifactory).

## Install from npm

Using [npm](https://www.npmjs.com/get-npm):

```bash
npm install uifactory lodash
```

To include it in your script, use

```html
<script src="node_modules/lodash/lodash.min.js"></script>
<script src="node_modules/uifactory/uifactory.js"></script>
```

## Components are HTML templates

For example, you can create a component like this:

```html
<repeat-html value="8">★</repeat-html>
```

... that repeats the star (★) 8 times, like this:

![8 stars](docs/repeat-8-star.png)

To create this `<repeat-html>` component, add a `<template component="repeat-html">` like this:

```html
<template component="repeat-html" value="30">
  ${this.innerHTML.repeat(+value)}
</template>
```

This uses [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
inside the `<template>` to generate the HTML. Now,

```html
<repeat-html value="8">★</repeat-html>
```

... renders this output:

![8 stars](docs/repeat-8-star.png)

**NOTE**: You **MUST** have a dash (hyphen) in the component name (e.g. `repeat-html`).
[It's a standard](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements).


## Lodash templates are supported

For better control, you can use [lodash templates](https://lodash.com/docs/#template):

```html
<template component="repeat-template" value="30">
  <% for (var j=0; j < +value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
</template>
```

When you add the component to your page:

```html
<repeat-template value="8">★</repeat-template>
```

... it renders this output:

![8 stars](docs/repeat-8-star.png).

Lodash templates use tags as follows:

- Anything inside `<% ... %>` runs as JavaScript
- Anything inside `<%= ... %>` runs as JavaScript, and the result is "print"ed

## Wrap tables in HTML scripts

Some Lodash templates may lead to invalid HTML.

For example, HTML doesn't allow `<% for ... %>` inside a `<tbody>`. (Only `<tr>` is allowed.) So this is invalid:

```html
<template component="table-invalid" rows="3">
  <table>
    <tbody>
      <% for (let i=0; i < +rows; i++) { %>
        <tr><td>Row <%= i %></td></tr>
      <% } %>
    </tbody>
  </table>
</template>
```

Instead, you should wrap your HTML inside a `<script type="text/html">...</script>`.
Anything you write inside it will be rendered as a Lodash template.
(Any HTML outside it is ignored.)

```html
<template component="table-valid" rows="3">
  <script type="text/html">
    <table>
      <tbody>
        <% for (let i=0; i < +rows; i++) { %>
          <tr><td>Row <%= i %></td></tr>
        <% } %>
      </tbody>
    </table>
  </script>
  If you have a script type="text/html",
  any HTML outside it is ignored.
</template>
<table-valid rows="5"></table-valid>
```


## Define properties using `<template attr="...">`

Any attributes you add to `<template>` can be accessed via `element.attr`.
For example, `<template component="repeat-html" value="30">` defines a property `.value`:

```html
<script>
let el = document.querySelector('repeat-html')  // Find first <repeat-html>
console.log(el.value)                           // Prints the value=".."
el.value = 10                                   // Re-render with value=10
</script>
```

![Access and change properties](docs/g-repeat-properties.gif)

Changing `.value = ...` *re-renders* the component. So does `.setAttribute('value', ...)`.

Notes:

- Attributes with uppercase letters (e.g. `fontSize`) are converted to lowercase properties (e.g. `fontsize`)
- Attributes with a dash/hyphen (e.g. `font-size`) are converted to *camelCase* properties (e.g. `fontSize`).
- Attributes not in the template are **NOT** properties, even if you add them in the component (e.g. `<my-component extra="x">` does not define a `.extra`).


## Access properties as variables inside templates

Inside templates, properties are available as JavaScript variables.
For example, `<template value:number="30">` defines the variable `value` as a number with a default of 30:

```html
<template component="repeat-value" value:number="30">
  <% for (var j=0; j < value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
</template>
<repeat-value value="8"></repeat-value>
```

Inside the template, the variable `value` has a value `8`.


## Define property types using `<template attr:js="...">`

By default, properties are strings. You can specify `number`, `boolean`, `array`, `object` or `js`
like this:

- `<template component="..." num:number="30">` defines `.num` as a number `30`
- `<template component="..." bool:boolean="true">` defines `.bool` as a boolean `true`
- `<template component="..." arr:array="[3,4]">` defines `.arr` as an array `[3, 4]`
- `<template component="..." obj:object="{x:1}">` defines `.obj` as an object `{x: 1}`
- `<template component="..." expr:js="Math.ceil(2.2) + num">` defines `.expr` as a JS expression
  evaluating to `3 + num`. `num` could be a global variable or another property.

For example, when you add this to your page:

```html
<template component="property-types" str="x" num:number="30" bool:boolean="true"
          arr:array="[3,4]" obj:object="{x:1}" expr:js="Math.ceil(2.2) + num">
  <%= JSON.stringify({str: str, num: num, bool: bool, arr: arr, obj: obj, expr: expr}) %>
</template>
<property-types></property-types>
```

... it renders this output:

```json
{"str":"x","num":30,"bool":true,"arr":[3,4],"obj":{"x":1},"expr":33}
```


## Fetch URLs using the `:url` type

To fetch a URL as text, specify `:url` as the property type. For example, this `<fetch-page>`
component displays "Loading..." until a URL is loaded, and then displays it.

```html
<template component="fetch-page" src:url="">
  <% if (!src) { %>
    Loading...
  <% } else { %>
    <%= src.text %>
  <% } %>
</template>
<fetch-page src="page.txt"></fetch-page>
```

... it renders the contents of [page.txt](test/page.txt):

```text
Contents of page.txt
```

The `:url` object is a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object
with one change: `.text` has the text of response. The following keys maybe useful:

- `.headers`: response [headers](https://developer.mozilla.org/en-US/docs/Web/API/Response/headers)
- `.status`: HTTP status code
- `.statusText`: HTTP status message corresponding to the status code (e.g., OK for 200)
- `.ok`: `true` if the HTTP status is the range 200-299
- `.url`: The URL of the response -- after any redirections
- `.text`: Text from the loaded page. This is **not a Promise**, but the actual text


## Access `<template>` as `this` inside templates

Inside the [template](#lodash-templates-are-supported),
`this` is the template element (e.g. `<template component="g-repeat">`).
For example

- `this.innerHTML` has the contents of your template.
- `this.querySelectorAll('div')` fetches all `<div>`s in your template

This `<repeat-icons>` component repeats everything under `class="x"` x times, and everything under
`class="y"` y times.

```html
<template component="repeat-icons" x:number="3" y:number="2">
  <%= this.querySelector('.x').innerHTML.repeat(x) %>
  <%= this.querySelector('.y').innerHTML.repeat(y) %>
</template>
```

When you add the component to your page:

```html
<repeat-icons style="padding:3px">
  <span class="x">🙂</span>
  <span class="y">😡</span>
</repeat-icons>
```

... it renders this output:

🙂🙂🙂😡😡


## Access `<component>` as `$target` inside templates

The [template](#lodash-templates-are-supported) variable `$target` is the component element itself.

For example, this component makes its parent's background yellow.

```html
<template component="parent-background" color="yellow">
  <% $target.parentElement.style.background = color %>
</template>
```

When you add the component to your page:

```html
<div>
  <parent-background></parent-background>
  This has a yellow background
</div>
```

... it renders this output:

![Access $target element](docs/parent-background.png)

This lets you control not just the component, but parents, siblings, and any other elements on a page.


## Update properties with `.update()`

You can change multiple properties together using `.update({attr1: val, attr2: val})`. For example,
this component has 2 properties, `char` and `value`:

```html
<template component="repeat-props" char="★" value:number="10">
  ${char.repeat(value)}
</template>
<repeat-props char="★" value="10"></repeat-props>
```

When you add this script to your page:

```html
<script>
  document.querySelector('repeat-props').update({ char: '⚡', value: 8 })
</script>
```

... updates both `char` and `value` to generate this output:

![update() changes multiple properties](docs/repeat-props.png)

`.update()` also updates the attributes and re-renders the component. `.update()` takes a second dict with options:

- `attr: false` does not update the attribute. Default: `true`
- `render: false` does not re-render the component. Default: `true`

For example, this updates the properties without changing the attributes and without re-rendering.

```html
<script>
  document.querySelector('repeat-props').update({ char: '⚽', value: 5 }, { attr: false, render: false })
</script>
```

To just re-render the component without changing properties, use `.update()`.

```html
<script>
  document.querySelector('repeat-props').update()
</script>
```


## Define property types as JSON

[Properties](#define-properties-using-template-attr) are strings by default.
To use numbers, booleans, arrays, objects, etc., you can define properties as JSON.

For example, this creates a simple list component:

```html
<template component="simple-list">
  <script type="application/json">
    // Add a single object {} under <script type="application/json">.
    // Create a list of properties. The property "type" defines how it's treated
    { "properties": [ { "name": "list", "type": "array", "value": [] } ] }
  </script>
  <ul>
    <% list.forEach(function (val) { %>
      <li><%= val %></li>
    <% }) %>
  </ul>
</template>
```

When you add the component to your page, the list attribute is parsed as an array:

```html
<simple-list list="[4, 'ok', true]"></simple-list>
```

... it renders this output:

- 4
- ok
- true

Here's an example that shows all types possible:

```html
<template component="typed-props">
  <script type="application/json">
    // Add a single object {} under <script type="application/json">.
    {
      // It should have a "properties": [list of objects]
      "properties": [
        // Each property has a name, optional type, and value
        { "name": "name", "type": "string", "value": "" },
        { "name": "value", "type": "number", "value": 0 },
        { "name": "is-set", "type": "boolean", "value": false },
        { "name": "data-list", "type": "array", "value": [] },
        { "name": "config", "type": "object", "value": {} },
      ]
    }
  </script>

  Use .name     as string:  <%= name.repeat(3) %>.
  Use .value    as number:  <%= "x".repeat(value) %>.
  Use .isSet    as boolean: <%= typeof isSet %>.
  Use .dataList as array:   <%= dataList.length %>.
  Use .config   as object:  <%= JSON.stringify(config) %>.
</template>
<typed-props name="key" value="10" is-set="true"
  data-list="[1,2,3,4,5,6,7,8]" config="{x:1}"></typed-props>
```

`"properties":` is an array of objects with these keys:

- `name`: property name. e.g. `"name": "data-list"` defines a property `.dataList` and variable `dataList`
- `type`: OPTIONAL: property type. Valid values are `string` (default), `number`, `boolean`, `object` or `array`.
- `value`: default value of the correct type. e.g. `"value": true` for `boolean`, `"value": [30, 40]` for array, etc.

Note:

- The `"properties":` override the `<template>` attributes
- The `"properties":` needn't be JSON either. JavaScript is fine. For example, `config="{x:1}"`
  will work even though `{x:1}` is not valid JSON (`{"x":1}` is JSON). Comments are allowed.


## Style components with CSS

Use regular CSS in the `<style>` tag to style components.

For example, this adds a yellow background to `<g-repeat>` if it has `value="8"`:

```html
<template component="repeat-style" value:number="30">
  <style>
    repeat-style[value="8"] { background-color: yellow; }
  </style>
  <% for (var j=0; j < value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
</template>
```

When you add the component to your page:

```html
<repeat-style value="8">★</repeat-style>
```

... it renders this output:

![Yellow background applied to g-repeat](docs/g-repeat-8-star-yellow.png)


## Link to external stylesheets

You can link to external stylesheets. For example, this imports Bootstrap 4.6.

```html
<template component="bootstrap-button" type="primary">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css">
  <button class="btn btn-<%= type %> m-3"><%= this.innerHTML %></button>
</template>
```

When you add the component to your page:

```html
<bootstrap-button type="success">★</bootstrap-button>
```

... it renders this output:

![Bootstrap button with external style](docs/bootstrap-button.png)

All `<style>`s and `<link rel="stylesheet">`s are copied from the `<template>` and appended to the document's HEAD.
They run only once (even if you use the component multiple times.)


## Override styles normally

UIFactory just copies the HTML into the component. There's no shadow DOM. You can override a component styles normally.

For example, this `<style>` affects buttons inside the component:

```html
<style>
  /* When user hovers on any button inside a repeat-style, or a .lime button, color it lime */
  repeat-style button:hover, repeat-style button.lime {
    background-color: lime;
  }
</style>
<repeat-style value="5">
  🙂<button>★</button>
</repeat-style>
```

... it renders this output:

![repeat-style colors button on hover](docs/repeat-style-hover.gif)


## Add behavior with JavaScript

Use regular JavaScript to add logic and interactivity.

```html
<template component="text-diff" x="" y="">
  "${x}" is ${distance(x, y)} steps from "${y}"
  <script src="https://cdn.jsdelivr.net/npm/levenshtein/lib/levenshtein.js"></script>
  <script>
    distance = (x, y) => (new Levenshtein(x, y)).distance
  </script>
</template>
```

When you add the component to your page:

```html
<text-diff x="back" y="book"></text-diff>
```

... it renders this output:

```text
"back" is 2 steps from "book"
```

All `<script>`s are copied from the `<template>` and appended to the document's BODY in order.
They run only once (even if you use the component multiple times.)


## Always delegate events

`<script>` tags run *before the component is rendered*.
So **ALWAYS use event delegation**.

```js
// DON'T DO THIS -- your component has not yet been added to the document!
document.querySelector('<your-component>').addEventListener('<event>', function (e) {
  // do what you want -- but it won't work
})
// INSTEAD, DO THIS. Listen to your event (e.g. "click") on document.body
document.body.addEventListener('<your-event>', function (e) {
  // Check if the clicked element is in YOUR component
  let target = e.target.closest('<your-component>')
  if (target) {
    // do what you want
  }
})
```

For example, this is a component that toggles color when a button is clicked:

```html
<template component="toggle-red">
  <style>
    .red { color: red; }
  </style>
  <button>Toggle</button> <span>Some text</span>
  <script>
    document.body.addEventListener('click', function (e) {
      let target = e.target.closest('toggle-red button')
      if (target)
        target.nextElementSibling.classList.toggle('red')
    })
  </script>
</template>
```

When you add the component to your page:

```html
<toggle-red></toggle-red>
```

... it renders this output:

![Add events via event delegation](docs/toggle-red.gif)


## Import components from HTML files

To re-use components across projects, save one or more component `<template>`s in a HTML file.
For example, `tag.html` could look like this:

```html
<template component="tag-a">
  This is tag-a
</template>
<template component="tag-b">
  This is tag-b
</template>
```

To import it in another file, use:

```html
<script src="node_modules/uifactory/uifactory.js" import="tag.html"></script>
```

Now you can use all `<template component="...">` components from `tag.html`. For example:

```html
<tag-a></tag-a>
<tag-b></tag-b>
```

This uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch),
the fetched files must be in the same domain, or
[CORS-enabled](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).

You can import multiple component files separated by comma and/or spaces.

```html
<tag2-a></tag2-a>
<tag2-b></tag2-b>
<script src="node_modules/uifactory/uifactory.js" import="tag.html, tag2.html"></script>
```

You can use relative and absolute paths, too. For example:

```html
<tag3-a></tag3-a>
<tag3-b></tag3-b>
<tag4-a></tag4-a>
<tag4-b></tag4-b>
<script src="node_modules/uifactory/uifactory.js" import="
  ../test/tag3.html
  https://cdn.jsdelivr.net/npm/uifactory/test/tag4.html
"></script>
```

You can also import via JavaScript:

```html
<tag5-a></tag5-a>
<tag5-b></tag5-b>
<script>
uifactory.register('tag5.html')
</script>
```

-------------------------------------------------


# Advanced options

## Register component with options

To register a component with full control over the options, use:

```html
<repeat-options value="8"></repeat-options>
<script>
// Add this AFTER the component is defined, not before. Else this.innerHTML won't be defined.
// See https://github.com/WICG/webcomponents/issues/551
uifactory.register({
  name: 'repeat-options',
  template: '<% for (var j=0; j<+value; j++) { %><%= this.innerHTML %><% } %>',
  properties: [
    { name: "value", value: "30", type: "number" }
  ]
})
</script>
```

The object has these keys:

- `name`: component name, e.g. `"g-repeat"`
- `template`: component contents as a [template](#lodash-templates-are-supported)
- `properties`: OPTIONAL: list of [properties](#define-property-types-as-json) as `{name, value, type}` property definitions
- `window`: OPTIONAL: the [Window](https://developer.mozilla.org/en-US/docs/Web/API/Window) on which to register the component. Used to define components on other windows or IFrames
- `compile`: OPTIONAL: the [template compiler](#use-any-compiler) function to use


## `el.data[property]` stores all properties

All properties are stored in `el.data` as an object. For example:

```html
<script>
let el = document.querySelector('repeat-html')  // Find first <repeat-html>
console.log(el.data)                            // Prints { "value": ".." }
el.data.value = 12                              // Updates the value property
el.update()                                     // You need to explicitly re-render
</script>
```

For example, if you define a `<template query-selector="xx">`, will `el.querySelector` be "xx" or the
[el.querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector) function?

ANS: `el.querySelector` is the function. `el.data.querySelector` holds "xx".

This is be useful if you don't know whether a property is defined or not.
For example, when you add this to your page:

```html
<template component="obj-values" x:number="0" y:number="0">
  Properties:
    <% for (let key in $target.data) { %>
      <%= key %>=<%= $target.data[key] %>
    <% } %>
  z=<%= 'z' in $target.data ? 'defined' : 'undefined' %>
</template>
<obj-values x="10" y="20"></obj-values>
```

... it renders this output:

`Properties: $target=[object HTMLElement] x=10 y=20 z=undefined`


## Create components dynamically

You can dynamically add components at any time. For example:

```html
<div id="parent1"></div>
<script>
  document.querySelector('#parent1').innerHTML = '<repeat-html value="8">★</repeat-html>'
</script>
```

... adds `<repeat-html value="8">★<repeat-html>` to the body.

![8 stars](docs/repeat-8-star.png)

This code does the same thing:

```html
<div id="parent2"></div>
<script>
  let el = document.createElement('repeat-html')
  el.innerHTML = '★'
  el.setAttribute('value', '8')
  document.querySelector('#parent2').appendChild(el)
</script>
```


## Add properties to an instance using types

You can [defining properties on templates](#define-properties-using-template-attr). But you can
add properties on an instance too.

For example, if you have a `<base-component>` with a `base` or `root` attributes like this:

```html
<template component="base-component" base:number="10" root:url="">
  Instance properties:
  <% for (let key in $target.data) { %>
    <%= key %>=<%= $target.data[key] %>
  <% } %>
</template>
```

... you can add a custom property when creating the element, by adding a type (e.g. `:number`) like this:

```html
<base-component child:number="20"></base-component>
```

This will render:

```text
Instance properties: $target=[object HTMLElement] base=10 root= child=20
```

The `child` JavaScript variable is now available (as a number).

The instance types **override** the template. For example, here, `base` and `root` are defined as
`:js`, which overrides the template's `base:number`:

```html
<base-component child:number="20" base:js="1 + 2" root:js="2 + 3"></base-component>
```

This will render:

```text
Instance properties: $target=[object HTMLElement] base=3 src=5 child=20
```


## Add custom types

We define property types on attributes like this: `attr:type="value"`. The default types are
`number`, `boolean`, `array`, `object` or `js`.

You can add a new custom type by extending `uifactory.types`. For example:

```js
uifactory.types.newtype = {
  parse: string => ...,         // Function to convert string to value
  stringify: value => ...       // Function to convert value to string
}
```

Let's add type called `:range`, which creates an array of values:

```js
uifactory.types.range = {
  // Parse a string like seq:range="0,10,2" into [0, 2, 4, 6, 8]
  parse: string => {
    // Pick start, step, end as the first 3 numbers in the string
    let [start, end, step] = string.split(/\D+/)
    // Convert it into an array
    return _.range(+start || 0, +end || 1, +step || 1)
  },
  // Stringify an array like [0, 2, 4, 6, 8] into "0,10,2"
  stringify: value => {
    let start = value[0]                      // First value, e.g. 0
    let step = value[1] - value[0]            // 2nd - 1st value, e.g. 2
    let end = value[value.length - 1] + step  // Last value + step, e.g. 8 + 2 = 10
    return `${start},${end},${step}`
  }
}
```

When you add a component using this custom type to your page:

```html
<template component="custom-range" series:range="">
  Values are <%= JSON.stringify(series) %>
</template>
<custom-range series="0,10,2"></custom-range>
```

... it renders this output:

`Values are [0,2,4,6,8]`


## Custom types need a parse and stringify function

Each [custom type](#add-custom-types) you add to `uifactory.types` needs a `parse` and `stringify`
functions with the following signature:

- `parse(string, name, data)`: Converts the attribute `name:type="string"` into the property `$el.data.name`
  - `string`: string value of the attribute
  - `name`: name of the attribute. (Property names are in camelCase. This is in kebab-case)
  - `data`: all properties of the component, computed so far
- `stringify(value, name, data)`: Converts the property `$el.data.name == value` into a attribute value string
  - `value`: JavaScript object holding the property value
  - `name`: name of the attribute. (Property names are in camelCase. This is in kebab-case)
  - `data`: all properties of the component, computed so far

It can be quite useful to have all properties available as `data`. This lets you parse attributes
based on previous attributes.

For example, let's create a `:formula` type that executes JavaScript. For example:

```js
uifactory.types.formula = {
  // Compile string into a JavaScript function, call it with data, return the result
  parse: (string, name, data) => {
    let fn = new Function('data', `with (data) { return (${string}) }`)
    return fn(data)
  },
  // Just convert the value into a JSON string
  stringify: value => JSON.stringify(value)
}
```

When you add a component using this custom type to your page:

```html
<template component="custom-formula" x:number="0">
  x=<%= x %>, y=<%= y %>, z=<%= z %>
</template>
<custom-formula x="10" y:formula="x * x" z:formula="2 * y + x"></custom-formula>
```

... it renders this output:

`x=10, y=100, z=210`

The `:formula` type evaluates values in the context of previous values.


## Check if ready with `.ui.ready`

You can check if a component is ready (i.e. rendered for the first time), using the
`.ui.rendered` Promise. For example, this component uses an external script. It may time to
get read.

```html
<template component="text-diff2" x="" y="">
  ${x} is <strong>${distance(x, y)} steps</strong> from ${y}
  <script src="https://cdn.jsdelivr.net/npm/levenshtein@1.0.5/lib/levenshtein.js"></script>
  <script>
    distance = (x, y) => (new Levenshtein(x, y)).distance
  </script>
</template>

<text-diff2 x="back" y="book"></text-diff>
```

When check if it has been ready, use:

```js
  let el = await document.querySelector('text-diff2').ui.ready
  // The <strong> child will be present only after the component is ready.
  el.querySelector('strong').style.color = 'red'
```

It turns the `<strong>` element red when it's ready:

![When ready, element is rendered](docs/text-diff2.png)


## Every render triggers a `render` event

Every time a component is rendered, it fires a `render` event.

```html
<template component="repeat-event" value:number="10">
  ${this.innerHTML.repeat(value)}
</template>

<repeat-event>★</repeat-event>
```

For example, this code logs the `.value` of the component every time it is rendered:

```js
  let el = document.querySelector('repeat-event')
  el.addEventListener('render', e => console.log(e.target.value))
  el.value = 3
```


## Get registered components from `uifactory.components`

If you register a `<ui-config>` component, `uifactory.components['ui-config']` has the component's
configuration, i.e. its name, properties, template, and any other options used to register the
component.

For example, this component renders its own configuration.

```html
<template component="ui-config" str="x" arr:array="[3,4]" expr:js="3 + 2">
  <%= JSON.stringify(uifactory.components['ui-config']) %>
</template>
```

When you add the component to your page:

```html
<ui-config></ui-config>
```

... it renders this output:

```json
{
  "name": "ui-config",
  "template": "\n <%= JSON.stringify(uifactory.components['ui-config']) %>\n",
  "properties": [
    {
      "name": "str",
      "type": "text",
      "value": "x"
    },
    {
      "name": "arr",
      "type": "array",
      "value": "[3,4]"
    },
    {
      "name": "expr",
      "type": "js",
      "value": "3 + 2"
    }
  ]
}
```


## Use any compiler

Instead of [templates](https://lodash.com/docs/#template), you can use any function to compile templates.

For example, the `g-name` component below uses [Handlebars](https://handlebarsjs.com/) templates to render the last name in bold:

```html
<g-name first="Walt" last="Disney">
<script src="https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.js"></script>
<script>
uifactory.register({
  name: 'g-name',
  template: '{{ first }} <strong>{{ last }}</strong>',
  compile: Handlebars.compile
})
</script>
```

![g-name component](docs/g-name-walt-disney.png)

You can change [lodash template settings](https://lodash.com/docs/4.17.15#templateSettings) into
[Tornado-like templates](https://www.tornadoweb.org/en/stable/template.html) like this:


```html
<g-repeat2 value="8">★</g-repeat2>
<script>
uifactory.register({
  name: 'g-repeat2',
  template: '{% for (var j=0; j<+value; j++) { %}{{ this.innerHTML }}{% } %}',
  compile: html => _.template(html, {
    escape: /{{-([\s\S]+?)}}/g,
    evaluate: /{%([\s\S]+?)%}/g,
    interpolate: /{{([\s\S]+?)}}/g
  })
})
</script>
```

![8 stars](docs/repeat-8-star.png)

`compile:` must be a function that accepts a string that returns a template function.
When rendering, the template function is called with the properties object
(e.g. `{first: "Walt", last: "Disney", this: ...}`).
Its return value is rendered inside the component.

For example, this is a "template" that replaces all words beginning with `$` by looking up the properties object:

```html
<g-name first="Walt" last="Disney">
<script>
uifactory.register({
  name: 'g-name',
  template: '$first <strong>$last</strong>',
  compile: function (html) {
    // Returns template function
    return function (obj) {
      // Replace $xxx with obj["xxx"] and return the template
      return html.replace(/\$([a-zA-Z0-9_]+)/g, function (match, key) {
        return obj[key] || '$' + key
      })
    }
  }
})
</script>
```

![g-name component](docs/g-name-walt-disney.png)

## Support

Tested in Chrome 74+, Firefox 66+, Edge 18+, and Safari 11+. IE is not supported.

You can raise issues and feature requests at <https://github.com/gramener/uifactory/issues>.

## Change log

- 0.0.10 (9 Jun 2021): `<svg-chart>` component added. `:js` allows properties as variables.
- 0.0.9 (2 Jun 2021): The `:url` attribute type [fetches data from a URL](#fetch-urls-using-the-url-type)
- 0.0.8 (27 May 2021): Custom types' `.parse()` receives `this.data` as input
- 0.0.7 (26 May 2021): Allow [custom types](#custom-types-need-a-parse-and-stringify-function)
- 0.0.6 (21 Apr 2021): Allow [property type definitions](#define-properties-using-template-attr)

## Release

To release a new version:

- In `README.md`, update the [Change log](#change-log)
- In [package.json](package.json), update `version`

Then run:

```bash
git commit . -m"BLD: Release x.x.x"
git push
npm publish
```
