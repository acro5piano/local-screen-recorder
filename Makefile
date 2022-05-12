dev:
	make -j __serve __watch

__serve:
	php -S localhost:6677

__watch:
	yarn nodemon --watch src --ext ts --exec 'make build'

build:
	yarn --silent esbuild src/main.ts --bundle --minify > public/dist/main.min.js
