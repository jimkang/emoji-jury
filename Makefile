HOMEDIR = $(shell pwd)
SSHCMD = ssh $(SMUSER)@smidgeo-headporters
APPDIR = /var/apps/emoji-jury

pushall: sync
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(SMUSER)@smidgeo-headporters:/var/apps/ --exclude node_modules/
	ssh $(SMUSER)@smidgeo-headporters "cd /var/apps/emoji-jury && npm install"

restart-remote:
	$(SSHCMD) "systemctl restart emoji-jury"

install-service:
	$(SSHCMD) "chmod +x /var/apps/emoji-jury/jury-responder.js && \
	chmod 777 -R /var/apps/emoji-jury/data/jury-chronicler.db"
	$(SSHCMD) "cp $(APPDIR)/emoji-jury.service /etc/systemd/system && \
	systemctl daemon-reload"
