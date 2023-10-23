Summary: Datatable Panel
Name:    briangann-datatable-panel
Version: 2.0.0
Release: %{_buildno}%{?dist}
License: MIT
Group:   GRNOC
URL:     https://github.com/briangann/grafana-datatable-panel/
Source:  https://github.com/briangann/grafana-datatable-panel

BuildArch: noarch
BuildRoot: %(mktemp -ud %{_tmppath}/%{name}-%{version}-%{release}-XXXXXX)

BuildRequires: nodejs

%description
Datatable panel for Grafana

%prep
rm -rf %{_builddir}

mkdir -p %{_builddir}
cp -pr %{_sourcedir}/.  %{_builddir}

%build
yarn install
yarn build

%install
rm -rf $RPM_BUILDR_ROOT

%{__install} -d -p %{buildroot}%{_sharedstatedir}/grafana/plugins/briangann-datatable-panel/dist
cp -ar %{_builddir}/dist/* %{buildroot}%{_sharedstatedir}/grafana/plugins/briangann-datatable-panel/dist

%files
%{_sharedstatedir}/grafana/plugins/briangann-datatable-panel/dist
