/* eslint-env es6 */

(function(window) {
  // From https://github.com/lodash/lodash/blob/master/unescape.js
  const htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  }
  const reEscapedHtml = /&(?:amp|lt|gt|quot|#(0+)?39);/g
  const reHasEscapedHtml = RegExp(reEscapedHtml.source)
  function unescape(string) {
    return (string && reHasEscapedHtml.test(string))
      ? string.replace(reEscapedHtml, (entity) => (htmlUnescapes[entity] || "'"))
      : (string || '')
  }

  // Register a single component
  function _registerComponent(config) {
    // The custom element is defined on this window. This need not be the global window.
    // For an iframe, you can use registerComponent({window: iframe.contentWindow}).
    const _window = config.window || window

    // convert attributes (e.g. font-size) to camelCase (e.g. fontSize)
    const camelize = s => s.replace(/-./g, x => x.toUpperCase()[1])

    // Each window has its own component registry. "this" picks the registry of the current window
    // If a component is already registered, don't re-register.
    // TODO: Should this be an error or a warning?
    if (_window.customElements.get(config.name))
      return console.trace(`Can't redefine component ${config.name} on ${_window}`)

    // Parse the template into DOM element
    const parser = new DOMParser()
    const dom = parser.parseFromString(config.template, 'text/html')

    // Add the styles and scripts into the target document under <head> and <body>
    // target is "head" or "body" -- the element where we add it into the document
    loadExtract('head', dom.documentElement.querySelectorAll('link[rel="stylesheet"], style'))
    loadExtract('body', dom.documentElement.querySelectorAll('script'))
    function loadExtract(target, els, _start = 0) {
      // Loop through elements starting from the start index
      for (let index = _start; index < els.length; index++) {
        let el = els[index]
        // Copy the element into the target document with attributes
        const clone = _window.document.createElement(el.tagName)
        for (let attr of el.attributes)
          clone.setAttribute(attr.name, attr.value)
        clone.innerHTML = el.innerHTML
        // If this is a <script src="...">, then load the remaining extracts AFTER it's loaded
        // WHY? If I use <script src="jquery"> and then <script>$(...)</script>
        //    the 2nd script should wait for the 1st script to load.
        // Why not just...
        //    Use clone.async = false? Doesn't work
        //    Add all scripts to a documentFragment and add it at one shot? Doesn't work
        let externalScript = el.tagName.toLowerCase() == 'script' && el.hasAttribute('src')
        if (externalScript)
          clone.onload = clone.onerror = () => loadExtract(target, els, index + 1)
        _window.document[target].appendChild(clone)
        // If this is a <script src="...">, we've scheduled the next loadExtract.
        // So stop looping
        if (externalScript)
          break
      }
    }
    // Remove extracted styles and scripts from template
    for (let el of dom.documentElement.querySelectorAll('link[rel="stylesheet"], style, script'))
      el.remove()
    // Convert the rest of the template into a Lodash template
    const template = _.template(unescape(dom.body.innerHTML))
    // The {name: ...} from the options list become the observable attrs
    const options = config.options || []
    const attrs = options.map(option => option.name)

    // Create the custom HTML element
    class UIFactory extends _window.HTMLElement {
      connectedCallback() {
        // Called when the component is created. "this" is the created HTMLElement.

        // Expose the defined attributes as properties.
        // <g-component attr="val"> exponses el.attr == "val"
        attrs.forEach(attr => {
          Object.defineProperty(this, attr, {
            get: function () {
              return this.getAttribute(attr)
            },
            set: function (val) {
              this.setAttribute(attr, val)
            }
          })
        })

        // this.__obj holds the object passed to the template.
        // Initialize this.__obj with default values.
        let obj = this.__obj = {}
        options.forEach(({ name, value }) => obj[name] = value)
        // Element attributes are available as variables. Convert kebab-case to camelCase
        for (var i = 0, len = this.attributes.length; i < len; i++)
          obj[camelize(this.attributes[i].name)] = this.attributes[i].value
        // template can access the component at $target
        obj.$target = this
        // template can access to the original children via "this"
        this.__originalNode = this.cloneNode(true)

        // Generate a connect event on this component when it's created
        this.dispatchEvent(new CustomEvent('connect', { bubbles: true }))
        // this.render() re-renders the object based on current options.
        this.render()
      }

      render(config) {
        // "this" is the HTMLElement. Apply the lodash template
        this.innerHTML = template.call(this.__originalNode, Object.assign(this.__obj, config))
        // Generate a render event on this component when re-rendered
        this.dispatchEvent(new CustomEvent('render', { bubbles: true }))
      }

      // The list of attributes to watch for changes on is based on the keys of
      // config.options, When any of these change, attributeChangedCallback is called.
      static get observedAttributes() {
        return attrs
      }

      // When any attribute changes, update this.__obj and re-render
      attributeChangedCallback(name, oldValue, newValue) {
        // If the component is not initialized, don't render it
        // If it's intialized, re-render
        if (this.__obj) {
          this.__obj[name] = newValue
          this.render()
        }
      }
    }

    // Use customElements from current window.
    // To use a different window, use createComponent.call(your_window, component)
    _window.customElements.define(config.name, UIFactory)
  }

  // If called via <script src="components.js" component="g-component, ...">, load each component
  let fetchComponent
  if (document.currentScript) {
    let base = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/'))
    fetchComponent = component => {
      fetch(`${base}/component/${component}.json`)
        .then(response => response.json())
        .then(config => registerComponent(config))
        .catch(error => console.error(error))
    }
    let components = (document.currentScript.getAttribute('component') || '').trim()
    if (components)
      components.split(/[,+ ]+/g).forEach(fetchComponent)
  }

  // Any <template component="..."> becomes a component
  document.querySelectorAll('template[component]').forEach(component => {
    // A template like <template component="comp" attr="val">
    // has componentname = "comp" and config.options = {attr: {value: "val", type: "text"}}
    let componentname, options = []
    for (let attr of component.attributes)
      if (attr.name == 'component')
        componentname = attr.value.toLowerCase()
      else
        options.push({ name: attr.name, type: 'text', value: attr.value })

    // Create the custom component on the current window
    _registerComponent({
      name: componentname,
      // If <template> tag is used unescape the HTML. It'll come through as &lt;tag-name&gt;
      // But if <script> tag is used, no need to unescape it.
      // Currently, we don't allow a <script> tag, so always unescape it.
      template: unescape(component.innerHTML),
      options: options
    })
  })

  // uifactory.register({ name: 'g-component', template: '<%= 1 + 2 %>', window: window })
  //    creates a <g-component> with the lodash template
  // uifactory.register('g-comp1', 'g-comp2')
  //    loads these components from ../component/g-comp1.json, etc
  // uifactory.register.call({...})
  //    registers component in specified window
  // AVOID ARROW => FUNCTIONS. We need to preserve "this". "this" defaults to the current window.
  // But uifactory.register.call(iframe_window, {...}) will register in the iframe_window.
  // TODO: Allow registering a custom DOM element
  this.uifactory = {
    register: function (...configs) {
      // TODO: handle this
      configs.forEach(config => {
        if (typeof config == 'object')
          _registerComponent(config)
        else if (fetchComponent && typeof config == 'string')
          fetchComponent(config)
      })
    }
  }

})(this)
