const isServerlessRuntime = !!process.env.NEXT_PUBLIC_VERCEL_ENV;

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

const host = isProduction
  ? `https://${process.env.NEXT_PUBLIC_WEBSERVER_HOST}`
  : isServerlessRuntime
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : `http://${process.env.NEXT_PUBLIC_WEBSERVER_HOST}:${process.env.NEXT_PUBLIC_WEBSERVER_PORT}`;

export default Object.freeze({
  host,
  isBuildTime,
  isProduction,
  isServerlessRuntime,
});
