Summary: Datatable Panel
Name:    briangann-datatable-panel
Version: 0.0.6
Release: %{_buildno}%{?dist}
License: Apache
Group:   GRNOC
URL:     https://github.com/briangann/grafana-datatable-panelu/
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
npm install
grunt

%install
rm -rf $RPM_BUILDR_ROOT

%{__install} -d -p %{buildroot}%{_sharedstatedir}/grafana/plugins/briangann-datatable-panel/dist
cp -ar %{_builddir}/dist/* %{buildroot}%{_sharedstatedir}/grafana/plugins/briangann-datatable-panel/dist

%files
%{_sharedstatedir}/grafana/plugins/briangann-datatable-panel/dist
