function extractFromRequest(request) {
  let realIp;

  if (request instanceof Request) {
    realIp =
      request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || request.socket.remoteAddress;
  } else {
    realIp = request.headers['cf-connecting-ip'] || request.headers['x-real-ip'] || request.socket.remoteAddress;
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

export default Object.freeze({
  extractFromRequest,
});
