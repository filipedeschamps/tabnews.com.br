function extractFromRequest(request) {
  let realIp;

  if (request instanceof Request) {
    realIp =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.socket?.remoteAddress ||
      '127.0.0.1';
  } else {
    realIp =
      request.headers['cf-connecting-ip'] ||
      request.headers['x-real-ip'] ||
      request.socket?.remoteAddress ||
      '127.0.0.1';
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

function socketFromRequest(request) {
  let socketIp = request.socket?.remoteAddress;

  // Localhost loopback in IPv6
  if (socketIp === '::1') {
    socketIp = '127.0.0.1';
  }

  // IPv4-mapped IPv6 addresses
  if (socketIp?.substr(0, 7) == '::ffff:') {
    socketIp = socketIp.substr(7);
  }

  return socketIp;
}

export default Object.freeze({
  extractFromRequest,
  socketFromRequest,
});
