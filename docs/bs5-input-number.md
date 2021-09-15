# bs5-input

`<bs5-input>` of type `number` renders input element, modifying parts of it is based on changing the attribute at bs5-input tag.

This is useful when creating:

-- Any kind of forms [ eg: Login/Signup forms, contact forms etc..] 

## Usage

Add this code anywhere in your HTML page:

```html
<script src="https://cdn.jsdelivr.net/npm/lodash/lodash.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/uifactory@0.0.16/dist/uifactory.min.js" import="@bs5-input"></script>

<bs5-input type="number" title="Number" default="" placeholder="Enter your age" bs5-class="" maxLength=100 media="" help="Use only numericals" prefix-item="" sufix-item="" title-placement =""></bs5-input>
```

This renders the following output:

![bs5-input example output] (bs5-input-number.jpg)
with inline label - bs5-input-number-inlineLabel.jpg
## Properties

`<bs5-input>` has 11 properties:
-  `type` : defines the type of input element
- `title` : is the label of an input element and treats as an string
- `default`: Its a schema name for value and value for an input can be set using this attribute
- `placeholder` : placeholder attribute defines the sort hint of expected value
- `bs5-class` : Generaly acts as an supportive class attribute, passing any class name with this attribute will be treated as second class name for an element
- `maxLength` : sets maximum length of letters than input can allow user to enter
- `media` : Expects image url , which can be added inside input element as a sufix [pefer to use this for name or email id type]
- `help` : Description of an input element [eg: for email help could be 'Please use abc@xyz.com format']
- `prefix-item and sufix-item` : If prefix and sufix item is defined at the bs5-input tag level, then input element can accept any html content or string [ eg: img tag, i class tag or string]and renders as an input group element
- `title-placement` - if title placement attribute is set as `inline` input label will be rendered on left side of an element.
if title placement attribute is set as `block` input label will be rendered on top of element.

 

