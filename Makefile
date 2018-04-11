BUILD_NUMBER ?= 0

dev:
	rm -rf ./node_modules
	npm install
	grunt
rpm:
	rpmbuild -bb briangann-datatable-panel.spec --define "_sourcedir ${PWD}" --define="_buildno ${BUILD_NUMBER}"
