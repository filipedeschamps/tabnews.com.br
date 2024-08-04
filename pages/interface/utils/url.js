import webserver from 'infra/webserver';

const webserverHostname = new URL(webserver.host).hostname;

export function isExternalLink(link) {
  const linkUrl = new URL(link, webserver.host);
  return webserverHostname !== linkUrl.hostname;
}

export function getDomain(link) {
  const linkUrl = new URL(link, webserver.host);
  const domain = linkUrl.hostname;

  if (domain.startsWith('www.')) {
    return domain.substring(4);
  }
  return domain;
}
