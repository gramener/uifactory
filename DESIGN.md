# Design decisions

## 2.0 migration

- `<script $inline>` will become `<script>`. This is the default mode
- `<script $global>` (?) will be added to the `<head>`
- `<script onrender>` will not work without `$`, i.e. `<script $onrender>`

## `attr:=` assigns dynamic attributes

We need an approach that is valid HTML and simple. `<div <%= ... %>>` is NOT valid because we can't have `<` or `>` inside tags.
Here are the options evaluated:

- Invalid HTML
  - `<select <%= $@.attr({required: true, ...this.$data}) %>>`
  - `<select <%: {required: true, ...this.$data} %> ></select>`
  - `<select {%: {required: true, ...this.$data} %}></select>`
  - `<select <: {required: true, ...this.$data} :></select>`
  - `<select <%= $attr({required: true, ...this.$data}) %>`
- Valid HTML
  - `<select $attr="<%: {required: true, ...this.$data} %>"></select>`
  - `<select $required="required" $="{...this.$data}"></select>`
  - `<select required:js="true" :js="{...this.$data}"></select>`
  - `<select @required="true" @="{...this.$data}"></select>`
  - `<select required:="true" :="{...this.$data}">` -- selected as the simplest

Note: These should be parseable as regular expressions. We cannot use `DOMParser()` since templates need not be valid HTML (e.g. tables with Lodash templates)

## `<style>` won't allow templating

We won't allow dynamic styling like this:

```html
<style>
  my-component {
    width: ${width}px;
    height: ${height}px;
  }
</style>
```

`<style>` is parsed only once, not per render. Instead, use inline styles (e.g. `style="width:${width}px"`).


## `UIFactory` class won't be exposed

One possible reason is to subclass it. But UIFactory expects people to learn as little as possible. Subclassing is not part of this.
