.PHONY : install push force_push 

install:
	rm -f yarn.lock || true
	yarn install

start:
	nodemon app.js

push:
	git add .
	git status
	git commit -m"[sync]"|| true 
	git push all master

force_push:
	git add .
	git status
	git commit -m"[sync]"|| true 
	git push -f all master
