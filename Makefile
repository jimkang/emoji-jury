HOMEDIR = $(shell pwd)
SSHCMD = ssh $(SMUSER)@smidgeo-headporters
APPDIR = /var/apps/emoji-jury

pushall: sync
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(SMUSER)@smidgeo-headporters:/var/apps/ --exclude node_modules/ --exclude data/
	ssh $(SMUSER)@smidgeo-headporters "cd /var/apps/emoji-jury && npm install"

restart-remote:
	$(SSHCMD) "systemctl restart emoji-jury"

set-permissions:
	$(SSHCMD) "chmod +x /var/apps/emoji-jury/jury-responder.js && \
	chmod 777 -R /var/apps/emoji-jury/data/jury-chronicler.db"

update-remote: sync set-permissions restart-remote

install-service:
	$(SSHCMD) "cp $(APPDIR)/emoji-jury.service /etc/systemd/system && \
	systemctl daemon-reload"
