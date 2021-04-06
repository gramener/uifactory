# UIFactory

UIFactory is a small easy-to-learn HTML component library.

- **It's small**. 2 KB minified, gzipped.
- **There's nothing new to learn**. No shadow DOM. No virtual DOM. Just regular HTML, CSS and JS.

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

For example, you can create a `<repeat-html value="8">★</repeat-html>` that component that repeats the star (★) 8 times.

![8 stars](docs/repeat-8-star.png)

Just add a `<template component="repeat-html">` to defines a new `<repeat-html>` element.

**NOTE**: You **MUST** have a dash (hyphen) in the component name (e.g. `repeat-html`).
[It's a standard](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements).

You can use [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) inside the `<template>`. For example:

```html
<template component="repeat-html" value="30">
  ${this.innerHTML.repeat(+value)}
</template>
```

When you add the component to your page:

```html
<repeat-html value="8">★</repeat-html>
```

... it renders this output:

![8 stars](docs/repeat-8-star.png)

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

## HTML scripts are supported

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


## Define properties using template attributes

Any attributes you add to `<template>` creates a property. For example, `<template component="repeat-html" value="30">` defines a property `.value`:

```html
<script>
let el = document.querySelector('repeat-html')  // Find first <repeat-html>
console.log(el.value)                           // Prints the value=".."
el.value = 10                                   // Re-render with value=10
</script>
```

![Access and change properties](docs/g-repeat-properties.gif)

Changing a property via via `.value = ...` *re-renders* the component. So does changing it via `.setAttribute()`.

Notes:

- Attributes with uppercase letters (e.g. `fontSize`) are converted to lowercase properties (e.g. `fontsize`)
- Attributes with a dash/hyphen (e.g. `font-size`) are converted to *camelCase* properties (e.g. `fontSize`).
- Attributes not in the template are **NOT** properties, even if you add them in the component (e.g. `<my-component extra="x">` does not define a `.extra`).

## Access properties as variables

Inside templates, properties are available as JavaScript variables.
For example, `<template value="0">` defines the variable `value` with a default of 0:

```html
<template component="repeat-value" value="30">
  <% for (var j=0; j < +value; j++) { %>
    <%= this.innerHTML %>
  <% } %>
</template>
<repeat-value value="8"></repeat-value>
```

Inside the template, the variable `value` has a value `"8"`.


## Access `<template>` as `this`

Inside the [template](#lodash-templates-are-supported),
`this` is the template element (e.g. `<template component="g-repeat">`).
For example

- `this.innerHTML` has the contents of your template.
- `this.querySelectorAll('div')` fetches all `<div>`s in your template

This `<repeat-icons>` component repeats two

```html
<template component="repeat-icons" x="3" y="2">
  <%= this.querySelector('.x').innerHTML.repeat(+x) %>
  <%= this.querySelector('.y').innerHTML.repeat(+y) %>
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


## Access `<component>` as `$target`

Inside the [template](#lodash-templates-are-supported),
`$target` is the component you add (e.g. `<g-repeat>`).
For example, this adds a click event listener to each `g-repeat` component.

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

<!-- TODO: Will this add multiple event listeners if the component is re-rendered? -->

![Access $target element](docs/g-repeat-click-event.gif)

You can access component attributes, e.g. `<g-repeat color="red">` as `$target.getAttribute('color')`.


## Define property types as JSON

[Properties](#define-properties-using-template-attributes) are strings by default.
To use numbers, booleans, arrays, etc., you can define properties as JSON.

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

- The attributes needn't be JSON -- JavaScript is fine. For example, `config="{x:1}"` will work even though `{x:1}` is not valid JSON (`{"x":1}` is JSON).
- The `"properties":` needn't be JSON either. JavaScript is fine. For example, comments are allowed.


## Style components with CSS

Use regular CSS to style the components. The `<template>` is rendered directly inside the component (not a shadow DOM). So you can style the contents directly.

For example, this adds a yellow background to `<g-repeat>` if it has `value="8"`:

```html
<template component="repeat-style" value="30">
  <style>
    repeat-style[value="8"] { background-color: yellow; }
  </style>
  <% for (var j=0; j < +value; j++) { %>
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

UIFactory copies all `<style>`s and `<link rel="stylesheet">`s into the document's HEAD, and runs them only once (even if you use the component multiple times.)

You can style child elements like this:

```css
/* When user hovers on any image inside a g-repeat, add a black border */
repeat-style img:hover {
  border: 1px solid black;
}
```


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


## Import components from HTML files

To re-use components across projects, save the component code in a HTML file.
For example, `my-component.html` could look like this:

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

This imports all `<template component="...">` components from `path/to-my-component.html`

You can import multiple component files separated by comma and/or spaces.

```html
<script src="node_modules/uifactory/uifactory.js" import="a.html, b.html, c.html"></script>
```

You can also import via JavaScript:

```js
uifactory.register('path/to/component.html')
```

Notes:

- Since this uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch),
  the fetched files must be in the same domain, or
  [CORS-enabled](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).


# Advanced options

To register a component with full control over the options, use:

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
- `template`: component contents as a [template](#lodash-templates-are-supported)
- `properties`: OPTIONAL: a list of [attributes](#access-properties-as-variables) as `{name, value}` objects
- `window`: OPTIONAL: the [Window](https://developer.mozilla.org/en-US/docs/Web/API/Window) on which to register the component. Used to define components on other windows or IFrames
- `compile`: OPTIONAL: the [template compiler](#use-any-compiler) function to use


TODO: document other ways of registering


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
