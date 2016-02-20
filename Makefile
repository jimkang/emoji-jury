HOMEDIR = $(shell pwd)

pushall: sync
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(SMUSER)@smidgeo-headporters:/var/apps/ --exclude node_modules/
	ssh $(SMUSER)@smidgeo-headporters "cd /var/apps/emoji-jury && npm install"

run-remote:
	ssh $(SMUSER)@smidgeo-headporters "cd /var/apps/emoji-jury && psy start -n emoji-jury -- node jury-responder.js"
