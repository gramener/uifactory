/* eslint-env node */

module.exports = {
  "parserOptions": {
    "ecmaVersion": 8
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
    "html"
  ],
  "globals": {
    "uifactory": true
  },
  "extends": "eslint:recommended",
  "rules": {
    /* Override default rules */
    "indent": [2, 2, {"VariableDeclarator": 2}],  // Force 2 space indentation
    "linebreak-style": ["error", "unix"],         // Force UNIX style line
    "semi": ["error", "never"],                   // Force no-semicolon style
    "no-cond-assign": ["off", "always"],          // Allow this for loops
    "quotes": ["off", "double"]                   // We may go for a double-quotes style
  },
  "ignorePatterns": [
    "test/tape.js"
  ]
}
