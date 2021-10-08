# Releasing UIFactory

To release a new version:

- `npm run lint` to ensure no errors
- In `README.md`, update the [Change log](#change-log)
- Update `version` in all files and examples, and mainly in [package.json](package.json)

Then run:

```bash
git commit . -m"BLD: Release x.x.x"
git tag -m"" -a vx.x.x
git push --follow-tags
npm publish
```
