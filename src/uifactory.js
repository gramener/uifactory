/* eslint-env browser */

(function (window) {
  let uifactory = window.uifactory = window.uifactory || {
    // List of all UI components and their configuration
    components: {},
    // Registry of all attribute types and their convertors
    types: {},
    // Registry of all renderers
    renderers: {},
  }

  // Used to create document fragments
  let doc = window.document
  let tmpl = doc.createElement('template')

  // Keep string -> DOM and DOM -> string converters ready
  // parser.parseFromString(string) converts string to DOM
  let parser = new DOMParser()
  // serializer.serializeToString(dom) converts DOM to a string
  let serializer = new XMLSerializer()

  // Used to serialize and parse values of different types
  let types = uifactory.types
  types.string = {
    parse: v => v,
    stringify: s => s
  }
  types.number = types.boolean = types.array = types.object = types.json = types.js = {
    // Parse value as a JavaScript expression
    parse: (value, name, data) => {
      let fn = new Function('data', `with (data) { return (${value || '""'}) }`)
      // If we use <my-comp rules:js="rules">, we want "rules" to be window.rules,
      // not the default value of <template $name="my-comp" rules="">.
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

  let renderers = uifactory.renderers
  renderers.replace = (node, html) => node.innerHTML = html
  renderers.none = v => v

  // convert attributes (e.g. font-size) to camelCase (e.g. fontSize)
  let camelize = s => s.replace(/-./g, x => x.toUpperCase()[1])

  // observer is for attribute changes. Typed attribute changes (name:type) re-renders component via .update()
  const observer = new MutationObserver(function (mutations) {
    const updates = new Map()
    for (const mutation of mutations) {
      if (!updates.has(mutation.target))
        updates.set(mutation.target, {})
      updates.get(mutation.target)[mutation.attributeName] = mutation.target.getAttribute(mutation.attributeName)
    }
    for (const [target, update] of updates.entries())
      // Re-render only when a property (i.e. typed attribute name:type) is changed
      if (Object.keys(update).some(v => v.match(':'))) {
        target.update(update, { attr: false, render: true })
      }
  })

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
    let eventScripts = {}   // Lifecycle event scripts
    // Add the <link>/<style> under <head>, and <script> into <body> of target doc.
    loadExtract('head', tmpl.content.querySelectorAll('link[rel="stylesheet"], style'))
    loadExtract('body', tmpl.content.querySelectorAll('script'))
    // target is "head" or "body". els the list of DOM elements to add into target
    function loadExtract(target, els, _start = 0) {
      let index = _start
      // Loop through elements starting from the start index
      scriptLoop: for (; index < els.length; index++) {
        let el = els[index]
        // Copy the element into the target document with attributes.
        // NOTE: Just inserting el into the document doesn't let <script> elements execute.
        let clone = _window.document.createElement(el.tagName)
        let listeners
        for (let attr of el.attributes) {
          // If it's a <script onrender> or <script onpreconnect> etc, it's a lifecycle event script.
          // Compile it and don't add it to <head>
          if (attr.name.startsWith('on')) {
            listeners = eventScripts[attr.name.slice(2)] = eventScripts[attr.name.slice(2)] || []
            listeners.push(new Function(attr.value || 'e', `with (this.$data) { ${el.innerHTML} }`))
          }
          // Otherwise, copy attributes to the clone that we'll add into the <head>
          clone.setAttribute(attr.name, attr.value)
        }
        if (listeners)
          continue scriptLoop
        clone.innerHTML = el.innerHTML
        // If this is a <script src="...">, then load the remaining extracts AFTER it's loaded
        // WHY? If I use <script src="jquery"> and then <script>$(...)</script>
        //    the 2nd script should wait for the 1st script to load.
        // NOTE: Why not just...
        //    Use clone.async = false? Doesn't work
        //    Add all scripts to a documentFragment and add it at one shot? Doesn't work
        let externalScript = el.hasAttribute('src') && el.matches('script')
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
    // This also removes script type="application/json" and "text/html"
    for (let el of tmpl.content.querySelectorAll('link[rel="stylesheet"], style, script'))
      el.remove()

    // If there's a <script type="text/html">, use that for template. Else use rest of the template
    let html = unescape((htmlScript || tmpl).innerHTML)

    // The properties keys become the observable attributes
    let attrList = Object.keys(config.properties || {})

    // Create the custom HTML element
    class UIFactory extends _window.HTMLElement {
      constructor() {
        super()

        // CONFIG variables -- stuff that's in <template $render=""> etc are exposed
        // this.$compile is the HTML templating engine used. Defaults to microtemplate()
        this.$compile = (config.compile || microtemplate)(html)
        // this.$properties is a dict of all component properties and their info
        this.$properties = Object.assign({}, config.properties || {})
        // this.$render is the rendering function
        this.$render = config.render
          ? (typeof config.render == 'function' ? config.render : renderers[config.render])
          : renderers.replace
        // this.$template is the contents of the HTML
        this.$template = html

        // RESERVED variables -- may be exposed in the future
        // this.$name is the component name
        // this.$name = config.name
        // this.$window is the window object where this custom element is defined
        // this.window = _window

        // PUBLIC variables -- created by the component
        // this.$ready is a promise that's resolved when the element is rendered
        this.$ready = new Promise(resolve => this.$resolve = resolve)
        // this.$data has all variables available to a template
        this.$data = {}
        // this.$contents has the original instance DOM element, cloned for future reference

        // INTERNAL variables -- not guaranteed to remain
        // this.$resolve is a resolve promise. Called when component is ready
        // this.$updating: Is the component currently being updated?
      }

      // Called when element is connected to the parent. "this" is the HTMLElement.
      connectedCallback() {
        // Fire a preconnect event. At this point, $data has no attributes
        this.dispatchEvent(new CustomEvent('preconnect', { bubbles: true }))

        // Clone instance contents for future reference
        this.$contents = this.cloneNode(true)

        // Update properties from template attributes
        for (let [propName, propInfo] of Object.entries(this.$properties)) {
          this.update({ [propName]: propInfo.value }, { attr: false, render: false })
        }
        // Override with properties from instance attributes
        let hasTypedAttribute = false
        for (let attr of this.attributes) {
          let [name, type] = attr.name.split(':')
          // If the name has a : in it (e.g. x:number), add it as a typed property
          if (type)
            hasTypedAttribute = this.$properties[name] = { type, value: attr.value}
          // If the name is a property, update it.
          // Note: If the template has name:type=, but component has just name=, we STILL update it
          if (name in this.$properties)
            this.update({ [name]: attr.value }, { attr: false, render: false })
        }

        // Getting / setting properties updates the .$data model.
        for (let name in this.$properties) {
          let property = camelize(name)
          // If the property is already in HTMLElement, don't override it
          if (!(property in this)) {
            Object.defineProperty(this, property, {
              get: () => this.$data[property],
              // When property is updated, change the attribute, and re-render.
              // eslint-disable-next-line no-setter-return
              set: val => this.update({ [property]: val })
            })
          }
        }

        // If any instance attribute is typed, observe all attributes. Update on any typed attribute change
        if (hasTypedAttribute)
          observer.observe(this, { attributes: true })

        // Wait for external scripts to get loaded. Then render.
        scriptsResolve.then(() => {
          // Add lifecycle events
          for (let [eventName, listeners] of Object.entries(eventScripts)) {
            listeners.forEach(listener => this.addEventListener(eventName, listener))
          }
          // Render the component
          renderComponent.call(this)
        })

        // Fire a connect event. At this point, $data has attributes, but external scripts
        // may not be loaded, and contents have not been rendered.
        this.dispatchEvent(new CustomEvent('connect', { bubbles: true }))
      }

      disconnectedCallback() {
        // Fire a disconnect event. Element is disconnected from the DOM
        this.dispatchEvent(new CustomEvent('disconnect', { bubbles: true }))
      }

      // Update .$data with {"attribute-name:type": "value"}
      // Set attributes (converting kebab-case to camelCase) unless options.attr = false
      // Re-render unless options.render = false
      update(props = {}, options = {}) {
        if (this.$updating)
          return
        this.$updating = true
        try {
          // By default, .update() sets attributes and renders
          options = Object.assign({ attr: true, render: true }, options)
          // If the component is not connected, don't render it.
          // this.$contents is defined only when the component is connected
          if (this.$contents) {
            for (let [name, value] of Object.entries(props)) {
              // Allow typed properties
              let [propname, typename] = name.split(':')
              let type = uifactory.types[typename || this.$properties[propname] && this.$properties[propname].type] || types.string
              let isString = typeof value == 'string'
              let result = (isString && !options.noparse) ? type.parse(value, propname, this.$data) : value
              // If parse() returns a Promise, re-update the element after it resolves
              // TODO: Catch exception?
              if (result && typeof result.then == 'function') {
                result.then(r => {
                  this.update({ [propname]: r }, {
                    render: true,   // Re-render
                    noparse: true,  // Don't re-parse result
                    attr: false,    // Promises return complex objects. Don't serialize the result
                  })
                })
                result = null     // For now, set the result to a null value
              }
              this.$data[camelize(propname)] = result
              // Set the attribute if requested.
              // But if value is not a string, and no stringify is available, SKIP.
              if (options.attr && (isString || type.stringify)) {
                this.setAttribute(propname, isString ? value : type.stringify(value, propname, this.$data))
              }
            }
            if (options.render && scriptsLoaded) {
              renderComponent.call(this)
            }
          }
        } finally {
          this.$updating = false
        }
      }

      // The list of attributes to watch for changes on is based on the keys of
      // config.properties, When any of these change, attributeChangedCallback is called.
      static get observedAttributes() {
        return attrList
      }

      // When any attribute changes, update property and re-render
      attributeChangedCallback(name, oldValue, value) {
        this.update({ [name]: value }, { attr: false, render: true })
      }
    }

    // Re-renders the object based on current and supplied properties.
    function renderComponent() {
      // Fire a prerender event. At this point, $data has attributes, external scripts are loaded,
      // but contents are not rendered.
      this.dispatchEvent(new CustomEvent('prerender', { bubbles: true }))
      // TODO: <slot data-template> should re-compile template before it is rendered
      // Render the contents of the <template> as a microtemplate
      let src = this.$compile.call(this, this.$data)
      // Render slots
      let doc = parser.parseFromString(src, 'text/html')
      doc.querySelectorAll('slot').forEach(slot => {
        let name = slot.getAttribute('name')
        // TODO: For default slot, remove any slot="" elements
        let replacements = name ? this.$contents.querySelectorAll(`[slot="${name}"]`) : this.$contents.childNodes
        if (replacements.length)
          slot.replaceWith(...Array.from(replacements).map(v => v.cloneNode(true)))
        // TODO: if (slot.firstElementChild) slot.replaceWith(slot.firstElementChild)
      })
      // Render, i.e. set component contents to the target HTML
      this.$render(this, serializer.serializeToString(doc))

      // Resolve the "$ready" Promise
      this.$resolve(this)
      // Fire a render event. At this point, $data has attributes, external scripts are loaded,
      // and contents are rendered.
      this.dispatchEvent(new CustomEvent('render', { bubbles: true }))
    }

    // Use customElements from current window.
    // To use a different window, use createComponent.call(your_window, component)
    _window.customElements.define(config.name, UIFactory)
    // Add component config to the window uifactactory is defined in
    uifactory.components[config.name] = config
  }

  function registerElement(el, options) {
    // Register a template/script element like <template $name="comp" attr="val">
    // as a component {name: "comp", properties: {attr: {value: "val", type: "text"}}}
    let config = { name: '', properties: {} }
    // Define properties from attributes
    for (let attr of el.attributes) {
      let [name, type] = attr.name.split(':')
      type = type || 'string'
      // $name=, $render=, $compile=, etc become config.name, config.render, config.compile, etc
      if (name.startsWith('$'))
        config[name.slice(1)] = types[type].parse(attr.value)
      // Everything else becomes part of properties
      else
        config.properties[name] = { type: type, value: attr.value }
    }
    // Since <template> tag is used unescape the HTML. It'll come through as &lt;tag-name&gt;
    config.template = unescape(el.innerHTML)
    // Create the custom component on the current window, allowing options to override
    registerComponent(Object.assign(config, options))
  }

  // Register each <template $name="..."> in a document as a component.
  function registerDocument(doc, options) {
    // template[$name] won't work. We escape it using \24 = $
    doc.querySelectorAll('template[\\24name]').forEach(el => registerElement(el, options))
  }

  // Fetch a HTML template and register it.
  // If the URL is specified as @component-name, load component-name.html from the same directory
  // as uifactory. (This may be the src/ or dist/ folder.)
  function registerURL(url, options) {
    if (url[0] == '@') {
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

  // Register a URL or config
  uifactory.register = (config, options) => {
    if (typeof config == 'string')
      registerURL(config, options)
    else
      registerComponent(config)
  }

  // If called via <script src="components.js" import="path.html, ...">, import each file
  let components = doc.currentScript.getAttribute('import') || ''
  components.trim().split(/[,+ ]+/g).filter(v => v).forEach(registerURL)

  // When DOM all elements are loaded, register the current document
  window.addEventListener('DOMContentLoaded', () => registerDocument(doc))



  // UTILITY FUNCTIONS
  // ------------------------------------------------------------------------
  // _.unescape() from https://github.com/lodash/lodash/blob/master/unescape.js
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
  uifactory.unescape = unescape

  // _.escape() from https://github.com/lodash/lodash/blob/master/escape.js
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  const reUnescapedHtml = /[&<>"']/g
  const reHasUnescapedHtml = RegExp(reUnescapedHtml.source)
  function escape(string) {
    return (string && reHasUnescapedHtml.test(string))
      ? string.replace(reUnescapedHtml, (chr) => htmlEscapes[chr])
      : (string || '')
  }
  uifactory.escape = escape


  // microtemplate() is based on _.template() from https://cdn.jsdelivr.net/npm/lodash/lodash.js
  // This is a complex function to refactor and maintain. But we'd rather not import it because
  //  - we want to pass "this" to the template, which lodash does not support
  //  - we don't need a lot of lodash's overhead -- which ends up as 13KB gzipped

  // Used to make template sourceURLs easier to identify.
  var templateCounter = -1
  // Used to ensure capturing order of template delimiters.
  let reNoMatch = /($^)/
  // Used to match
  // [ES template delimiters](http://ecma-international.org/ecma-262/7.0/#sec-template-literal-lexical-components).
  let reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g
  // Used to match template delimiters.
  let reEscape = /<%-([\s\S]+?)%>/g
  let reEvaluate = /<%([\s\S]+?)%>/g
  let reInterpolate = /<%=([\s\S]+?)%>/g
  // Used to match unescaped characters in compiled string literals.
  let reUnescapedString = /['\n\r\u2028\u2029\\]/g
  // Used to escape characters for inclusion in compiled string literals.
  let stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  }
  // Used by `template` to escape characters for inclusion in compiled string literals.
  function escapeStringChar(chr) {
    return '\\' + stringEscapes[chr]
  }
  // Used to match empty string literals in compiled template source
  let reEmptyStringLeading = /\b__p \+= '';/g
  let reEmptyStringMiddle = /\b(__p \+=) '' \+/g
  let reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g
  // Used to validate the `validate` option in `_.template` variable.
  let reForbiddenIdentifierChars = /[()=,{}[\]/\s]/
  const INVALID_TEMPL_VAR_ERROR_TEXT = 'Invalid `variable` option passed into `_.template`'

  // Default template settings
  let templateSettings = {
    escape: reEscape,
    evaluate: reEvaluate,
    interpolate: reInterpolate,
    variable: '',
    imports: {},
    this: undefined
  }

  function microtemplate(string, options) {
    options = Object.assign({}, templateSettings, options)

    let imports = Object.assign({ uifactory }, options.imports)
    let importsKeys = Object.keys(imports)
    let importsValues = Object.values(imports)

    let isEscaping
    let isEvaluating
    let index = 0
    let interpolate = options.interpolate || reNoMatch
    let source = "__p += '"

    // Compile the regexp to match each delimiter.
    let reDelimiters = RegExp(
      (options.escape || reNoMatch).source + '|' +
      interpolate.source + '|' +
      (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
      (options.evaluate || reNoMatch).source + '|$'
      , 'g')

    // Use a sourceURL for easier debugging.
    // The sourceURL gets injected into the source that's eval-ed, so be careful
    // to normalize all kinds of whitespace, so e.g. newlines (and unicode versions of it) can't sneak in
    // and escape the comment, thus injecting code that gets evaled.
    var sourceURL = '//# sourceURL=' +
      (hasOwnProperty.call(options, 'sourceURL')
        ? (options.sourceURL + '').replace(/\s/g, ' ')
        : ('templateSources[' + (++templateCounter) + ']')
      ) + '\n'

    string.replace(reDelimiters, function (match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
      interpolateValue || (interpolateValue = esTemplateValue)

      // Escape characters that can't be included in string literals.
      source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar)

      // Replace delimiters with snippets.
      if (escapeValue) {
        isEscaping = true
        source += "' +\n__e(" + escapeValue + ") +\n'"
      }
      if (evaluateValue) {
        isEvaluating = true
        source += "';\n" + evaluateValue + ";\n__p += '"
      }
      if (interpolateValue) {
        source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'"
      }
      index = offset + match.length

      // The JS engine embedded in Adobe products needs `match` returned in
      // order to produce the correct `offset` value.
      return match
    })

    source += "';\n"

    // If `variable` is not specified wrap a with-statement around the generated
    // code to add the data object to the top of the scope chain.
    var variable = hasOwnProperty.call(options, 'variable') && options.variable
    if (!variable) {
      source = 'with (obj) {\n' + source + '\n}\n'
    }
    // Throw an error if a forbidden character was found in `variable`, to prevent
    // potential command injection attacks.
    else if (reForbiddenIdentifierChars.test(variable)) {
      throw new Error(INVALID_TEMPL_VAR_ERROR_TEXT)
    }

    // Cleanup code by stripping empty strings.
    source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
      .replace(reEmptyStringMiddle, '$1')
      .replace(reEmptyStringTrailing, '$1;')

    // Frame code as the function body.
    source = 'function(' + (variable || 'obj') + ') {\n' +
      (variable
        ? ''
        : 'obj || (obj = {});\n'
      ) +
      "var __t, __p = ''" +
      (isEscaping
        ? ', __e = uifactory.escape'
        : ''
      ) +
      (isEvaluating
        ? ', __j = Array.prototype.join;\n' +
        "function print() { __p += __j.call(arguments, '') }\n"
        : ';\n'
      ) +
      source +
      'return __p\n}'

    let result = Function(importsKeys, sourceURL + 'return ' + source)
      .apply(undefined, importsValues)
    result.source = source
    return result
  }
  uifactory.template = microtemplate
})(this)
