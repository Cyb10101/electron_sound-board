# Development

## Run

Terminal 1 - Run docker:

```bash
./start.sh up && ./start.sh zsh
yarn install
yarn build:dev
APP_ENV=dev ./node_modules/electron/dist/electron .
```

Terminal 2 - Run Electron at host:

```bash
APP_ENV=dev ./node_modules/electron/dist/electron .
```

## Build dist

Terminal 1 - Run docker:

```bash
./start.sh up && ./start.sh zsh
yarn install
yarn build
yarn dist
```

## Build dist & push

```bash
./start.sh up && ./start.sh zsh
yarn install
yarn build
yarn dist

git add package.json
git commit -m'Version 1.1.0'
git tag "v1.1.0"
git push && git push --tags
```
