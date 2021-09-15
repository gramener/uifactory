# bs5-input

`<bs5-input>` of type `switch` renders input element, modifying value or items of it is based on changing the attribute at bs5-input tag.

This is useful when creating:

-- User input selection
-- Any kind of forms [ eg: Login/Signup forms, contact forms etc..] 

## Usage 

Add this code anywhere in your HTML page:

```html
<script src="https://cdn.jsdelivr.net/npm/lodash/lodash.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/uifactory@0.0.16/dist/uifactory.min.js" import="@bs5-input"></script>

<bs5-input type="switch" items="['one','two','three','four','five']" default:array="['two','three']" ></bs5-input>
```

This renders the following output:

![bs5-input example output] (bs5-input-radio.jpg)
[Checked switch buttons] - bs5-input-switch-checked.jpg

## Properties

`<bs5-input>` has 2 properties:
-  `type` : defines the type of input element
- `items` : items is of an array type. can accepts multiple values each value will be drawn as switch buttons/components
- `default:array` : takes a values as an array and passed values in default array will be checked dynamically 

 

