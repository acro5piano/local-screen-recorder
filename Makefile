dev:
	make -j __serve __watch

__serve:
	php -S localhost:6677 -t public

__watch:
	yarn nodemon --watch src --ext ts --exec 'make build'

build:
	node_modules/.bin/esbuild src/main.ts --bundle --minify > dist/main.min.js
	node_modules/.bin/esbuild src/background.ts --bundle --minify > dist/background.min.js
	cp -v index.html manifest.json logo.png dist/
