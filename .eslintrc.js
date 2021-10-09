/* eslint-env node */

module.exports = {
  "parserOptions": {
    "ecmaVersion": 9
  },
  "overrides": [
    {
      "files": ["build.js"],
      "parserOptions": {
        "sourceType": "module"
      },
    }
  ],
  "env": {
    "browser": true,    // Include browser environment
    "es6": true,        // Include ES6 features
  },
  "plugins": [
    "html"              // Lint JS within HTML files
  ],
  "globals": {
    "uifactory": true,  // Test cases use uifactory
  },
  "extends": "eslint:recommended",
  "rules": {
    // Override default rules
    "indent": [2, 2, {"VariableDeclarator": 2}],  // Force 2 space indentation
    "linebreak-style": ["error", "unix"],         // Force UNIX style line
    "semi": ["error", "never"],                   // Force no-semicolon style
    "quotes": ["off", "double"]                   // We may go for a double-quotes style
  },
  "ignorePatterns": [
    "test/tape.js",             // Ignore generated file
  ]
}
