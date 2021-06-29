/* eslint-env browser */
/* globals _ */

(function (window) {
  // Used to create document fragments
  let doc = window.document
  let tmpl = doc.createElement('template')
  let parser = new DOMParser()
  let serializer = new XMLSerializer()

  // Used to serialize and parse values of different types
  let types = {
    str: {
      parse: v => v,
      stringify: s => s
    }
  }
  types.number = types.boolean = types.array = types.object = types.json = types.js = {
    // Parse value as a JavaScript expression
    parse: (value, name, data) => {
      let fn = new Function('data', `with (data) { return (${value || '""'}) }`)
      // If we use <my-comp rules:js="rules">, we want "rules" to be window.rules,
      // not the default value of <template component="my-comp" rules="">.
      // So replace "rules" (the name of the attribute) with window["rules"].
      return fn(Object.assign({}, data, {[name]: window[name]}))
    },
    stringify: JSON.stringify
  }
  types.url = {
    parse: value => {
      if (value && typeof value == 'string') {
        let response
        return fetch(value).then(r => {
          response = r
          return r.text()
        }).then(text => new Promise(resolve => {
          response.text = text
          resolve(response)
        }))
      } else
        return value
    }
    // No stringify for :url. Don't set attribute if property is set to an object
  }
  types.urljson = {
    parse: value => value && typeof value == 'string' ? fetch(value).then(r => r.json()) : value
    // No stringify for :urljson. Don't set attribute if property is set to an object
  }
  types.urltext = {
    parse: value => value && typeof value == 'string' ? fetch(value).then(r => r.text()) : value
    // No stringify for :urljson. Don't set attribute if property is set to an object
  }

  // convert attributes (e.g. font-size) to camelCase (e.g. fontSize)
  let camelize = s => s.replace(/-./g, x => x.toUpperCase()[1])

  // Register a single component
  function registerComponent(config) {
    // The custom element is defined on this window. This need not be the global window.
    // For an iframe, you can use registerComponent({window: iframe.contentWindow}).
    let _window = config.window || window

    // Each window has its own component registry. "this" picks the registry of the current window
    // If a component is already registered, don't re-register.
    // TODO: Should this be an error or a warning?
    if (_window.customElements.get(config.name))
      return console.warn(`Can't redefine component ${config.name}`)

    // Extract specific tags out of the HTML template. Used to remove <style>, <script>, etc.
    tmpl.innerHTML = config.template
    let htmlScript = tmpl.content.querySelector('script[type="text/html"]')
    // When the scripts are loaded, resolve this promise.
    let scriptsLoaded       // boolean: have all external scripts been loaded?
    let _scriptsResolve     // fn: resolves the scriptsLoad promise
    let scriptsResolve = new Promise(resolve => _scriptsResolve = resolve)
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
        let clone = _window.document.createElement(el.tagName)
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
      if (target == 'body' && index == els.length) {
        scriptsLoaded = true
        _scriptsResolve(true)
      }
    }

    // Remove extracted styles and scripts from template.
    // This also removes script type="application/json" "text/html"
    for (let el of tmpl.content.querySelectorAll('link[rel="stylesheet"], style, script'))
      el.remove()
    // If there's a <script type="text/html">, use that for template. Else rest of the template
    let html = _.unescape((htmlScript || tmpl).innerHTML)

    // Compile the rest of the template -- by default, using a Lodash template
    let compile = config.compile || _.template
    let template = compile(html)

    // The {name: ...} from the properties list become the observable attrs
    let properties = config.properties || []
    let attrs = properties.map(prop => prop.name)
    // attrparse[attr-name](val) parses attribute based on its type
    let attrinfo = {}
    properties.forEach(prop => {
      attrinfo[prop.name] = Object.assign({}, prop)
    })

    // Create the custom HTML element
    class UIFactory extends _window.HTMLElement {
      constructor() {
        super()

        this.ui = {}
        this.ui.ready = new Promise(resolve => this.ui._ready = resolve)
        // Each instance has its own attrinfo that can be updated by adding typed attributes
        this.ui.attrinfo = Object.assign({}, attrinfo)
      }

      connectedCallback() {
        // Called when element is connected to the parent. "this" is the HTMLElement.
        let self = this

        // this.data is the model, i.e. object passed to the template.
        // template can access the component at $target
        this.data = { $target: this }

        // Update properties from template attributes
        for (let { name, value } of Object.values(this.ui.attrinfo))
          this.update({ [name]: value }, { attr: false, render: false })
        // Override with properties from instance attributes
        for (let attr of this.attributes) {
          let [name, type] = attr.name.split(':')
          // If the name has a : in it (e.g. x:number), add it as a typed property
          if (type)
            this.ui.attrinfo[name] = { name, type, value: attr.value}
          // If the name is a property, update it.
          // Note: If the template has name:type= but component has just name=, we STILL update it
          if (name in this.ui.attrinfo)
            this.update({ [name]: attr.value }, { attr: false, render: false })
        }

        // Getting / setting properties updates the .data model.
        for (let name in this.ui.attrinfo) {
          let property = camelize(name)
          // If the property is already in HTMLElement, don't override it
          if (!(property in self))
            Object.defineProperty(self, property, {
              get: () => self.data[property],
              set: function (val) {
                self.update({ [property]: val }, { attr: true, render: false })
              }
            })
        }

        // templates can access to the original children of the node via "this"
        this.__originalNode = this.cloneNode(true)

        // Wait for external scripts to get loaded. Then render.
        scriptsResolve.then(() => this._render())
      }

      // Set the template variables. Converts kebab-case to camelCase
      // TODO: Change these to "false" defaults -- that's the real default value!
      update(props = {}, options = { attr: true, render: true }) {
        // If the component is not initialized, don't render it
        if (this.data) {
          for (let [name, value] of Object.entries(props)) {
            // TODO: not sure why we need window.uifactory.types here, instead of just types
            // But without it, the tests fail. Need to investigate and resolve.
            let type = window.uifactory.types[this.ui.attrinfo[name] && this.ui.attrinfo[name].type] || types.str
            let isString = typeof value == 'string'
            let result = (isString && !options.noparse) ? type.parse(value, name, this.data) : value
            // If parse() returns a Promise, re-update the element after it resolves
            // TODO: Catch exception?
            if (result && typeof result.then == 'function') {
              result.then(r => {
                this.update({ [name]: r }, {
                  render: true,   // Re-render
                  noparse: true,  // Don't re-parse result
                  attr: false,    // Promises return complex objects. Don't serialize the result
                })
              })
              result = null     // For now, set the result to a null value
            }
            this.data[camelize(name)] = result
            // Set the attribute if requested.
            // But if value is not a string, and no stringify is available, SKIP.
            if (options.attr && (isString || type.stringify))
              this.setAttribute(name, isString ? value : type.stringify(value, name, this.data))
          }
          if (options.render && scriptsLoaded)
            this._render()
        }
      }

      // this.render() re-renders the object based on current and supplied properties.
      _render() {
        // Render the contents of the <template> as lodash
        let src = template.call(this.__originalNode, this.data)
        // Render slots
        let doc = parser.parseFromString(src, 'text/html')
        doc.querySelectorAll('slot').forEach(slot => {
          let name = slot.getAttribute('name')
          // TODO: For default slot, remove any slot="" elements
          let replacements = name ? this.__originalNode.querySelectorAll(`[slot="${name}"]`) : this.__originalNode.childNodes
          if (replacements.length)
            slot.replaceWith(...Array.from(replacements).map(v => v.cloneNode(true)))
          // TODO: if (slot.firstElementChild) slot.replaceWith(slot.firstElementChild)
        })
        // "this" is the HTMLElement. Apply the lodash template
        this.innerHTML = serializer.serializeToString(doc)

        // Resolve the "ui.ready" Promise
        this.ui._ready(this)
        // Generate a render event on this component when rendered
        this.dispatchEvent(new CustomEvent('render', { bubbles: true }))
      }

      // The list of attributes to watch for changes on is based on the keys of
      // config.properties, When any of these change, attributeChangedCallback is called.
      static get observedAttributes() {
        return attrs
      }

      // When any attribute changes, update property and re-render
      attributeChangedCallback(name, oldValue, value) {
        this.update({ [name]: value }, { attr: false, render: true })
      }
    }

    // Use customElements from current window.
    // To use a different window, use createComponent.call(your_window, component)
    _window.customElements.define(config.name, UIFactory)
    // Add component config to the window uifactactory is defined in
    window.uifactory.components[config.name] = config
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
    for (let attr of el.attributes) {
      if (attr.name != 'component') {
        let [name, type] = attr.name.split(':')
        config.properties[name] = { name: name, type: type || 'text', value: attr.value }
      }
    }
    // Merge config with <script type="application/json"> configurations
    el.content.querySelectorAll('[type="application/json"]').forEach(text => {
      // Copy properties
      let conf = types.js.parse(text.innerHTML, '', {})
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
  // If the URL is specified as @component-name, load component-name.html from the same directory
  // as uifactory. (This may be the src/ or dist/ folder.)
  function registerURL(url, options) {
    if (url[0] == '@') {
      // @ts-ignore
      url = doc.currentScript.src.replace(/[^/]+$/, url.slice(1).replace(/\.html$/i, '') + '.html')
    }
    fetch(url)
      .then(response => response.text())
      .then(config => {
        tmpl.innerHTML = config
        registerDocument(tmpl.content, options)
      })
      .catch(console.error)
  }

  window.uifactory = {
    // List of all UI components and their configuration
    components: {},
    // Register a HTML element, URL or config
    register: (config, options) => {
      let _window = options && options.window || window
      if (config instanceof _window.HTMLElement)
        registerElement(config, options)
      else if (config instanceof _window.HTMLDocument)
        registerDocument(config, options)
      else if (typeof config == 'string')
        registerURL(config, options)
      else if (typeof config == 'object')
        registerComponent(config)
    },
    // Registry of all attribute types and their convertors
    types: types
  }

  // If called via <script src="components.js" import="path.html, ...">, import each file
  let components = doc.currentScript.getAttribute('import') || ''
  components.trim().split(/[,+ ]+/g).filter(v => v).forEach(registerURL)

  // When DOM all elements are loaded, register the current document
  window.addEventListener('DOMContentLoaded', () => registerDocument(doc))
})(this)
