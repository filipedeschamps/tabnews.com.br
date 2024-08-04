import webserver from 'infra/webserver';

const DEFAULT_TRUSTED_HOSTS = ['tabnews.com.br', 'github.com', 'curso.dev', 'filipedeschamps.com.br'];

const webserverHostname = new URL(webserver.host).hostname;
const trustedHosts = [...new Set([webserverHostname, ...DEFAULT_TRUSTED_HOSTS])];

export default function isTrustedDomain(url) {
  const { hostname } = new URL(url, webserver.host);
  return trustedHosts.some(
    (trustedHostname) => hostname === trustedHostname || hostname.endsWith(`.${trustedHostname}`),
  );
}
