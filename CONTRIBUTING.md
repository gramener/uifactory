# Contributing to UIFactory

Welcome, and thanks for considering contributing to UIFactory.

You could:

- **Report issues**. Have you identified a reproducible problem in UIFactory?
  - Check if it's already filed in [open issues](https://github.com/gramener/uifactory/issues/).
  - If it's filed, upvote it (👍).
  - If not, create a new issue. Please include the UIFactory version, the code, what you expected, and what happened.
- **Fix documentation**. Is the [documentation](https://github.com/gramener/uifactory/tree/master/docs/) unclear or wrong? Please report an issue, or send a pull request correcting it.
- **Fix issues**. If you'd like to fix an issue, please email <s.anand@gramener.com>.
- **Submit components**. If you'd like to add a component to UIFactory, please email <s.anand@gramener.com>.

We have a [code of conduct](CODE_OF_CONDUCT.md). Please follow it in your interactions with the project.


<!--
## TODO: Architecture
-->

## Coding style

This project follows the [`eslint:recommended`](https://eslint.org/docs/rules/) rules, with

- 2-space indentation
- UNIX line endings
- No semicolons
- Single quotes, not double quotes

## Releasing UIFactory

To release a new version:

- Update package version in [package.json](package.json) and all other files
- Run `npm update && npm upgrade`
- Run `npm run build`
- Run `npm run lint` and fix any errors
- Run `npm test` and fix any errors

Run:

```bash
git commit . -m"BLD: Release x.x.x"
git tag -m"" -a vx.x.x
git push --follow-tags
npm publish
```

- Add the [release notes on Github](https://github.com/gramener/uifactory/releases/new)
