# Development

## Run

Terminal 1 - Run docker:

```bash
docker-compose run --rm node
yarn install
yarn build:dev
```

Terminal 2 - Run Electron at host:

```bash
APP_ENV=dev ./node_modules/electron/dist/electron .
```

## Build dist

Terminal 1 - Run docker:

```bash
docker-compose run --rm node
yarn install
yarn build
yarn dist
```

## Build dist & push

Create tag for release:

```bash
# Change version in package.json
git add package.json
git commit -m'Version 1.1.0'
git tag -a -m'Version 1.1.0' 'v1.1.0'
git push && git push --tags
```

Create binaries for upload:

```bash
docker run --rm -ti \
    --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
    --env ELECTRON_CACHE='/root/.cache/electron' \
    --env ELECTRON_BUILDER_CACHE='/root/.cache/electron-builder' \
    -v ${PWD}:/project \
    -v /tmp/electron_sound-board/electron:/root/.cache/electron \
    -v /tmp/electron_sound-board/electron-builder:/root/.cache/electron-builder \
    electronuserland/builder:wine /bin/bash -c 'yarn && yarn dist:all && chown -R 1000:1000 /project/dist /project/node_modules'
```

Create new Github release:

* [Github releases](https://github.com/Cyb10101/electron_sound-board/releases)
* Draft a new release: Release v1.1.0

Upload files:

* ./dist/sound-board_linux_amd64.deb
* ./dist/sound-board_linux_x86_64.AppImage
* ./dist/sound-board_win_x64.exe
