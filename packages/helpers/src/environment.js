export const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

export const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

export const isServerlessRuntime = !!process.env.VERCEL;

export const isEdgeRuntime = typeof globalThis.EdgeRuntime !== 'undefined';

export const isLambdaRuntime = isServerlessRuntime && !isEdgeRuntime;
