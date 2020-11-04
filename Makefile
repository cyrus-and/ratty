.PHONY: all development production configure build serve clean

all: clean development configure build

development production:
	npx webpack --mode $@

configure build:
	node-gyp $@

serve:
	npx webpack-dev-server

clean:
	$(RM) -r dist/ build/
