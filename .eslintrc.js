module.exports = {
  "parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module",
  },
  "env": {
    "node": true,       // Include node globals
    "es6": true,        // Include ES6 features
  },
  "extends": "eslint:recommended",
  "rules": {
    /* Override default rules */
    "indent": [2, 2, {"VariableDeclarator": 2}],  // Force 2 space indentation
    "linebreak-style": ["error", "unix"],         // Force UNIX style line
    "semi": ["error", "never"],                   // Force no-semicolon style
    "no-cond-assign": ["off", "always"],          // Allow this for loops
    "quotes": ["off", "double"]                   // We may go for a double-quotes style
  }
}
