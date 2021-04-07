/* eslint-env es6 */

(function(window) {
  // Used to create document fragments
  const doc = window.document
  const tmpl = doc.createElement('template')

  // Used to serialize and parse values of different types
  const js_parse = s => eval(`(${s})`)
  const types = /number|boolean|object|array|json|js/i
  const stringify = (type, val) => type.match(types) ? JSON.stringify(val) : val
  const parse = (type, val) => type && type.match(types) ? js_parse(val) : val

  // convert attributes (e.g. font-size) to camelCase (e.g. fontSize)
  const camelize = s => s.replace(/-./g, x => x.toUpperCase()[1])

  // Register a single component
  function registerComponent(config) {
    // The custom element is defined on this window. This need not be the global window.
    // For an iframe, you can use registerComponent({window: iframe.contentWindow}).
    const _window = config.window || window

    // Each window has its own component registry. "this" picks the registry of the current window
    // If a component is already registered, don't re-register.
    // TODO: Should this be an error or a warning?
    if (_window.customElements.get(config.name))
      return console.trace(`Can't redefine component ${config.name} on ${_window}`)

    // Extract specific tags out of the HTML template. Used to remove <style>, <script>, etc.
    tmpl.innerHTML = config.template
    const htmlScript = tmpl.content.querySelector('script[type="text/html"]')
    // When the scripts are loaded, resolve this promise.
    let scriptsResolve
    const scriptsLoad = new Promise((resolve, rejected) => scriptsResolve = resolve)
    // Add the <link>/<style> under <head>, and <script> into <body> of target doc.
    loadExtract('head', tmpl.content.querySelectorAll('link[rel="stylesheet"], style'))
    loadExtract('body', tmpl.content.querySelectorAll('script'))
    // target is "head" or "body". els the list of DOM elements to add into target
    function loadExtract(target, els, _start = 0) {
      let index = _start
      // Loop through elements starting from the start index
      for (; index < els.length; index++) {
        let el = els[index]
        // Copy the element into the target document with attributes.
        // NOTE: Just inserting el into the document doesn't let <script> elements execute.
        const clone = _window.document.createElement(el.tagName)
        for (let attr of el.attributes)
          clone.setAttribute(attr.name, attr.value)
        clone.innerHTML = el.innerHTML
        // If this is a <script src="...">, then load the remaining extracts AFTER it's loaded
        // WHY? If I use <script src="jquery"> and then <script>$(...)</script>
        //    the 2nd script should wait for the 1st script to load.
        // NOTE: Why not just...
        //    Use clone.async = false? Doesn't work
        //    Add all scripts to a documentFragment and add it at one shot? Doesn't work
        let externalScript = clone.hasAttribute('src') && clone.matches('script')
        if (externalScript)
          clone.onload = clone.onerror = () => loadExtract(target, els, index + 1)
        _window.document[target].appendChild(clone)
        // If this is a <script src="...">, we've scheduled the next loadExtract.
        // So stop looping. In fact, OUTRIGHT return. DON'T resolve scripts until loaded
        if (externalScript)
          return
      }
      // If we've loaded all scripts -- internal and external -- mark scripts as loaded
      if (target == 'body' && index == els.length)
        scriptsResolve(true)
    }

    // Remove extracted styles and scripts from template.
    // This also removes script type="application/json" "text/html"
    for (let el of tmpl.content.querySelectorAll('link[rel="stylesheet"], style, script'))
      el.remove()
    // If there's a <script type="text/html">, use that for template. Else rest of the template
    let html = _.unescape((htmlScript || tmpl).innerHTML)

    // Compile the rest of the template -- by default, using a Lodash template
    const compile = config.compile || _.template
    const template = compile(html)
    // The {name: ...} from the properties list become the observable attrs
    const properties = config.properties || []
    const attrs = properties.map(prop => prop.name)
    // attrparse[attr-name](val) parses attribute based on its type
    const attrparse = Object.fromEntries(properties.map(prop => [prop.name, parse.bind(this, prop.type)]))

    // Create the custom HTML element
    class UIFactory extends _window.HTMLElement {
      connectedCallback() {
        // Called when element is connected to the parent. "this" is the created HTMLElement.

        // this.__model is the model, i.e. object passed to the template.
        // template can access the component at $target
        this.__model = { $target: this }
        // Initialize with default values from properties, overriding it with attributes' values
        const attrs = {}
        for (let { name, value } of this.attributes)
          attrs[name] = value
        for (let { name, value } of properties)
          this.__set(name, attrs[name] || value)

        // Expose the defined attributes as properties.
        // <g-component attr-name="val"> exponses el.attrName == "val"
        // GET .property returns from this.__model[property]
        // SET .property sets this.__model[property] = val and sets the attr = stringify(val)
        properties.forEach(prop => {
          let property = camelize(prop.name)
          Object.defineProperty(this, property, {
            get: function () {
              return this.__model[property]
            },
            set: function (val) {
              this.__model[property] = val
              this.setAttribute(prop.name, stringify(prop.type, val))
            }
          })
        })

        // templates can access to the original children of the node via "this"
        this.__originalNode = this.cloneNode(true)

        // Generate a connect event on this component when it's created
        this.dispatchEvent(new CustomEvent('connect', { bubbles: true }))
        // Wait for external scripts to get loaded. Then render.
        scriptsLoad.then(() => this.render())
      }

      // Set the template variables. Convert kebab-case to camelCase
      __set(name, value) {
        this.__model[camelize(name)] = typeof value == 'string' ? attrparse[name](value) : value
      }

      // this.render() re-renders the object based on current and supplied properties
      render(props) {
        // "this" is the HTMLElement. Apply the lodash template
        this.innerHTML = template.call(this.__originalNode, Object.assign(this.__model, props))
        // Generate a render event on this component when re-rendered
        this.dispatchEvent(new CustomEvent('render', { bubbles: true }))
      }

      // The list of attributes to watch for changes on is based on the keys of
      // config.properties, When any of these change, attributeChangedCallback is called.
      static get observedAttributes() {
        return attrs
      }

      // When any attribute changes, update this.__model[property] to convert(val) and re-render
      attributeChangedCallback(name, oldValue, value) {
        // If the component is not initialized, don't render it
        if (this.__model) {
          this.__set(name, value)
          this.render()
        }
      }
    }

    // Use customElements from current window.
    // To use a different window, use createComponent.call(your_window, component)
    _window.customElements.define(config.name, UIFactory)
  }

  function registerElement(el, options) {
    // Register a template/script element like <template component="comp" attr="val">
    // as a component {name: "comp", properties: {attr: {value: "val", type: "text"}}}
    let config = Object.assign({}, options, {
      name: el.getAttribute('component'),
      // Since <template> tag is used unescape the HTML. It'll come through as &lt;tag-name&gt;
      template: _.unescape(el.innerHTML),
      // Define properties as an object to make merge easier. But later, convert to list
      properties: {}
    })
    // Define properties from attributes
    for (let attr of el.attributes)
      config.properties[attr.name] = { name: attr.name, type: 'text', value: attr.value }
    // Merge config with <script type="application/json"> configurations
    el.content.querySelectorAll('[type="application/json"]').forEach(text => {
      // Copy properties
      let conf = js_parse(text.innerHTML)
      for (let attr of conf.properties || [])
        config.properties[attr.name] = Object.assign(config.properties[attr.name] || {}, attr)
    })
    // Convert properties back to a list, which is how registerComponent() needs it
    config.properties = Object.values(config.properties)
    // Create the custom component on the current window
    registerComponent(config)
  }

  // Register each <template component="..."> in a document as a component.
  function registerDocument(doc, options) {
    doc.querySelectorAll('template[component]').forEach(el => registerElement(el, options))
  }

  // Fetch a HTML template and register it.
  function registerURL(url, options) {
    fetch(url)
      .then(response => response.text())
      .then(config => {
        tmpl.innerHTML = config
        registerDocument(tmpl.content, options)
      })
      .catch(console.error)
  }

  window.uifactory = {
    // Register a HTML element, URL or config
    register: (config, options) => {
      if (config instanceof HTMLElement)
        registerElement(config, options)
      else if (typeof config == 'string')
        registerURL(config, options)
      else if (typeof config == 'object')
        registerComponent(config)
    }
  }

  // If called via <script src="components.js" import="path.html, ...">, import each file
  let components = doc.currentScript.getAttribute('import') || ''
  components.trim().split(/[,+ ]+/g).filter(v => v).forEach(registerURL)

  // When DOM all elements are loaded, register the current document
  window.addEventListener('DOMContentLoaded', () => registerDocument(doc))
})(this)
