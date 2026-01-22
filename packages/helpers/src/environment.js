const { NEXT_PHASE, NEXT_PUBLIC_VERCEL_ENV, VERCEL } = process.env;

export const isBuildTime = NEXT_PHASE === 'phase-production-build';

export const isProduction = NEXT_PUBLIC_VERCEL_ENV === 'production';

export const isServerlessRuntime = !!VERCEL;

export const isEdgeRuntime = typeof globalThis.EdgeRuntime !== 'undefined';

export const isLambdaRuntime = isServerlessRuntime && !isEdgeRuntime;
