# bs5-input

`<bs5-input>` of type `select` renders select dropdown element , modifying parts of it is based on changing the attribute at bs5-input tag.

## Usage

Add this code anywhere in your HTML page:

```html
<script src="https://cdn.jsdelivr.net/npm/lodash/lodash.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/uifactory@0.0.16/dist/uifactory.min.js" import="@bs5-input"></script>

<bs5-input type="select"  help="please select" title="Select role" items="['one','two','three','four','five']">
</bs5-input>
```

This renders the following output:

![bs5-input example output] (bs5-select.jpg)

## Properties

`<bs5-input>` has 3 properties:
-  `type` : defines the type of input element
- `title` : label of an input element
- `help` :  brief description of an input element [eg: for username help could be 'Please use alphanumeric characters']
-`items` : Child elements of select element


