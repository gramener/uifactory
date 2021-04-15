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

Remember:

- Attributes with uppercase letters (e.g. `fontSize`) are converted to lowercase properties (e.g. `fontsize`)
- Attributes with a dash/hyphen (e.g. `font-size`) are converted to *camelCase* properties (e.g. `fontSize`).


## Access `<template>` as `this` inside templates

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


## Define property types as JSON

[Properties](#define-properties-using-template-attr) are strings by default.
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

Use regular CSS in the `<style>` tag to style components.

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
    function distance(x, y) {
      return (new Levenshtein(x, y)).distance
    }
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

All `<script>`s are copied from the `<template>` and appended to the document's BODY.
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
<script src="node_modules/uifactory/uifactory.js" import="tag.html, tag2.html"></script>
<tag2-a></tag2-a>
<tag2-b></tag2-b>
```

You can use relative and absolute paths, too. For example:

```html
<script src="node_modules/uifactory/uifactory.js" import="
  ../test/tag3.html
  https://cdn.jsdelivr.net/npm/uifactory/test/tag4.html
"></script>
<tag3-a></tag3-a>
<tag3-b></tag3-b>
<tag4-a></tag4-a>
<tag4-b></tag4-b>
```

You can also import via JavaScript:

```html
<script>
uifactory.register('tag5.html')
</script>
<tag5-a></tag5-a>
<tag5-b></tag5-b>
```

-------------------------------------------------


# Advanced options

## Register component with options

To register a component with full control over the options, use:

```html
<repeat-options value="8"></repeat-options>
<script>
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
el.render()                                     // You need to explicitly re-render
</script>
```

For example, if you define a `<template query-selector="xx">`, will `el.querySelector` be "xx" or the
[el.querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector) function?

ANS: `el.querySelector` is the function. `el.data.querySelector` holds "xx".


## Create components dynamically

You can dynamically add components at any time. For example:

```html
<div id="parent"></div>
<script>
document.querySelector('#parent').innerHTML = '<repeat-template value="8">★<repeat-template>'
</script>
```

... adds `<repeat-template value="8">★<repeat-template>` to the body.

![8 stars](docs/repeat-8-star.png)

This code does the same thing:

```js
let el = document.createElement('repeat-template')
el.innerHTML = '★'
el.setAttribute('value', '8')
document.body.appendChild(el)
```

## Use `connect` and `render` events

The first time a component is added to the DOM, it fires a `connect` event.

Every time a component is redrawn, it fires a `render` event.

For example, this code logs every component's render event.

```js
document.addEventListener('render', function (e) {
  console.log(`${e.type} event fired on ${e.target}`)
})
```

![Event cycle for render](docs/render-event.gif)


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
