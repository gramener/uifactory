# UIFactory

UIFactory is a simple HTML component library.

- **It's small**. <1.5KB minified, gzipped.
- **Nothing new to learn**. No shadow DOM. No virtual DOM. Just regular HTML, CSS and JS.

## Installation

Using [npm](https://www.npmjs.com/get-npm):

```bash
npm install uifactory lodash
```

To include it in your script, use

```html
<script src="node_modules/lodash/lodash.min.js"></script>
<script src="node_modules/uifactory/uifactory.js"></script>
```

## Components are HTML elements

For example, you can create a `<g-repeat value="8">★</g-repeat>` that component that repeats the star (★) 8 times.

![8 stars](docs/g-repeat-8-star.png)

## ... defined as lodash templates

Any `<template component="x-xx">` defines a new `<x-xx>` element.

For example, this creates the `g-repeat` component we saw above:

```html
<template component="g-repeat" value="30">
  <% for (var j=0; j < +value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
</template>
```

The `component="g-repeat"` attribute defines a `<g-repeat>` component. You **MUST** have a hypen in the component name.

Wherever `<g-repeat></g-repeat>` is placed, the [lodash template](https://lodash.com/docs/#template) is rendered inside it.

- `<%= ... %>` renders JavaScript code.
- `<% ... %>` runs JavaScript code without rendering.

So, `<g-repeat value="8">★</g-repeat>` renders:

![8 stars](docs/g-repeat-8-star.png).


## Access attributes

`<template>` attributes are available as JavaScript variables. For example, `<template value="30">` defines the variable `value`:

```html
<template component="g-repeat" value="30">
  <% for (var j=0; j < +value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
</template>
```

When using the component, e.g. `<g-repeat value="8"></g-repeat>`, the variable `value` becomes `"8"`.

## Define properties

`<template>` attributes are available as component properties. For example, `<template component="g-repeat" value="30">` defines a property `.value`:

```html
<script>
let el = document.querySelector('g-repeat')   // Find the first <g-repeat>
console.log(el.value)                         // Prints the value=".."
el.value = 10                                 // Changes value="..." and re-renders
</script>
```

![Access and change properties](docs/g-repeat-properties.gif)

You can define new properties inside `<script type="application/json"></script>`.
For example:

```html
<template component="g-repeat">
  ...
  <script type="application/json">
    [
      { "name": "value", "type": "number", "value": 30 },
      { "name": "data-list", "type": "array", "value": [4, 5] },
    ]
  </script>
</template>
```

The properties list is an array of objects. Each object may have these keys:

- `name`: property name. e.g. `"name": "data-list"` defines a property `.dataList` and variable `dataList`
- `value`: default value. e.g. `"value": "[30, 40]"` sets the default value to `"[30, 40]"`
- `type`: property type. Valid values are `string` (default), `number`, `boolean`, `object` or `array`.

Attributes are strings. Properties and JavaScript variables are converted to your `type` automatically.


## Attributes = Properties = JavaScript Variables

- All [attributes](#access-attributes) in the `<template>` are properties.
  - Attributes in the component (e.g. `g-repeat`) **NOT** in the `<template>` are not properties.
- All [properties](#define-properties) in `<script type="application/json"></script>` are also also attributes.
- All attributes/properties are available as JavaScript variables.
- Changing attributes via `.setAttribute()` or properties via `.value = ...` *re-renders* the component.
- Attribute names with hyphens (e.g. `font-size`) are converted to *camelCase* properties and variables (e.g. `fontSize`).
- Attribute values are strings. Non-string types are converted using `JSON.stringify()`


## Access `<template>` as `this`

`this` points to the template element (e.g. `<template component="g-repeat">`). For example, you can access contents of your `<template>` via `this.innerHTML`.

- `this` is a copy of component template as a DOM element.
- `this.innerHTML` has whatever was in your template.
- `this.querySelectorAll('*')` and similar expressions can access parts of the template


## Access component as `$target`

`$target` points to the element you add (e.g. `<g-repeat>`). For example, this adds a click event listener to each `g-repeat` component.

```html
<template component="g-repeat" value="30">
  <% for (var j=0; j < +value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
  <%
    $target.addEventListener('click', console.log)
  %>
</template>
```

![Access $target element](docs/g-repeat-click-event.gif)

You can access component attributes, e.g. `<g-repeat color="red">`, via `$target.getAttribute('color')`.

Remember: `this` is the `<template>`. `$target` is the component, e.g. `<g-repeat>`


## Style components with CSS

Use regular CSS to style the components. The `<template>` is rendered directly inside the component (not a shadow DOM). So you can style the contents directly.

For example, this adds a yellow background to `<g-repeat>` if it has `value="8"`:

```html
<template component="g-repeat" value="30">
  <style>
    g-repeat[value="8"] { background-color: yellow; }
  </style>
  <% for (var j=0; j < +value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
</template>
```

![Yellow background applied to g-repeat](docs/g-repeat-8-star-yellow.png)

UIFactory copies all `<style>`s and `<link rel="stylesheet">`s into the document's HEAD, and runs them only once (even if you use the component multiple times.)


## Add events with JS

Use a `<script>` tag to add events or define your component's behavior. For example:

```html
<template component="g-repeat" value="30">
  <% for (var j=0; j < +value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
  <script>
    $('body').on('click', 'g-repeat', console.log)
  </script>
</template>
```

![Add events via event delegation](docs/g-repeat-click-delegate.gif)

This `<script>` will be executed *before the component is rendered*. So use [event delegation](https://davidwalsh.name/event-delegate), e.g. using [jQuery](https://api.jquery.com/on/) or [delegate](https://www.npmjs.com/package/delegate).

When a component is added, it fires a `connect` event. Use this to add listeners to the component itself.

When a component is redrawn, it fires a `render` event. Use this to add listeners to the component's children.

For example, this tracks every component's connect and render event.

```js
$('body').on('connect render', function (e) {
  console.log('EVENT', e.type, e.target.tagName)
})
```

![Event cycle for connect and render](docs/g-repeat-connect-render-events.gif)


## Import components

Save your component code in a HTML file. For example, `my-component.html` could look like this:

```html
<template component="my-component">
  ... your component code
</template>

<template component="another-component">
  ... your component code
</template>
```

To import it in another file, use:

```html
<script src="node_modules/uifactory/uifactory.js" import="path/to/my-component.html"></script>
```

All components in `component.html` are imported.

You can import multiple component files separated by comma and/or spaces.

```html
<script src="node_modules/uifactory/uifactory.js" import="a.html, b.html, c.html"></script>
```

The components must be in the same domain, or [CORS-enabled](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).


## Use `<script>` instead of `<template>` for tables

The `<template>` tag only allows valid HTML. So you CANNOT do this:

```html
<template component="table-row">
  <tr>
    <% cells.forEach(function(cell) { %>
      <td><%= cell></td>
    <% }) %>
  </tr>
</template>
```

... because `<tr>` only accepts `<td>` or `<th>` as children -- not `<% ... %>`.

Instead of `<template component="...">`, you can use `<script type="text/html" component="...">`.

```html
<script type="text/html" component="table-row">
  <tr>
    <% cells.forEach(function(cell) { %>
      <td><%= cell></td>
    <% }) %>
  </tr>
</script>
```

Since you can't use a `<script>` tag inside another `<script>` tag, to
[add events](#add-events-with-js) and [define properties](#define-properties), you need to
rename all `<script>...</script>` to `<x-script>...</x-script>`. For example:

```html
<script type="text/html" component="table-row">
  ...
  <x-script>
    // TODO: add events here
  </x-script>
  <x-script type="application/json">
    // TODO: define properties here
  </x-script>
</script>
```


## Register components API

To register a component from a HTML file, use:

```js
uifactory.register('path/to/component.html')
```

To register a component from a DOM element, use:

```js
uifactory.register(document.querySelector('template'))
```

To register a component by specifying elements explicitly, use:

```js
uifactory.register({
  name: 'g-repeat',
  template: '<% for (var j=0; j<+value; j++) { %><%= this.innerHTML %><% } %>',
  properties: [
    { name: "value", value: "30" }
  ]
})
```

The object has these keys:

- `name`: component name, e.g. `"g-repeat"`
- `template`: component contents as a [lodash template](#-defined-as-lodash-templates)
- `properties`: OPTIONAL: a list of [attributes](#access-attributes-as-variables) as `{name, value}` objects
- `window`: OPTIONAL: the [Window](https://developer.mozilla.org/en-US/docs/Web/API/Window) on which to register the component. Used to define components on other windows or IFrames
- `compile`: OPTIONAL: the [template compiler](#use-any-compiler) function to use


## Use any compiler

Instead of [lodash templates](https://lodash.com/docs/#template), you can use any function to compile templates.

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

![8 stars](docs/g-repeat-8-star.png)

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
