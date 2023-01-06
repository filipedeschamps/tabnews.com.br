import ipTools from 'ip';

function extractFromRequest(request) {
  let realIp;

  if (request instanceof Request) {
    if (isRequestFromCloudflare(request)) {
      return request.headers.get('cf-connecting-ip');
    }

    realIp =
      request.headers.get('x-vercel-proxied-for')?.split(', ').at(-1) || request.socket?.remoteAddress || '127.0.0.1';
  } else {
    realIp =
      request.headers['x-vercel-proxied-for']?.split(', ').at(-1) || request.socket?.remoteAddress || '127.0.0.1';
  }

  // Localhost loopback in IPv6
  if (realIp === '::1') {
    realIp = '127.0.0.1';
  }

  // IPv4-mapped IPv6 addresses
  if (realIp.substr(0, 7) == '::ffff:') {
    realIp = realIp.substr(7);
  }

  return realIp;
}

function isRequestFromCloudflare(request) {
  const proxyIp = request.headers.get('x-vercel-proxied-for')?.split(', ').at(-1);

  return !!(proxyIp && cloudflareIPs.find((ipRange) => ipTools.cidrSubnet(ipRange).contains(proxyIp)));
}

const cloudflareIPs = [
  '172.64.0.0/13',
  '162.158.0.0/15',
  '108.162.192.0/18',
  '198.41.128.0/17',
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

export default Object.freeze({
  extractFromRequest,
  isRequestFromCloudflare,
  tools: ipTools,
});
