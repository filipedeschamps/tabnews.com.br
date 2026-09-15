import { baseUrl, tryParseUrl } from '@tabnews/helpers';

const isUnderRoute = (pathname, route) => pathname === route || pathname.startsWith(`${route}/`);

export default function getLoginUrl(path) {
  const { pathname } = tryParseUrl(path, baseUrl);

  if (!pathname || isUnderRoute(pathname, '/cadastro')) return '/login';
  if (isUnderRoute(pathname, '/login')) return path;
  return `/login?redirect=${encodeURIComponent(path)}`;
}
