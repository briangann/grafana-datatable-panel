BUILD_NUMBER ?= 0

dev:
	rm -rf ./node_modules
	yarn install
	yarn build
rpm:
	rpmbuild -bb briangann-datatable-panel.spec --define "_sourcedir ${PWD}" --define="_buildno ${BUILD_NUMBER}"
