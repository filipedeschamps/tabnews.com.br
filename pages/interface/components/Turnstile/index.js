import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Box, Text, useConfirm } from '@/TabNewsUI';
import webserver from 'infra/webserver';

const BLOCKED_RESPONSE_MESSAGE = 'Requisição bloqueada pelo Firewall.';
const BLOCKED_RESPONSE_ACTION = 'Verifique seu equipamento e os dados enviados.';

const sitekey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

const turnstile = {
  ignore: false,
  queue: [],
  check: () => {},
};

export default function Turnstile() {
  const [isInteractive, setIsInteractive] = useState(false);
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!sitekey || window.onloadTurnstileCallback) return;

    replaceOriginalFetch();

    const turnstileOptions = {
      sitekey,
      theme: 'dark',
      language: 'pt-BR',
      appearance: 'interaction-only',
      execution: 'execute',
      callback: refetchQueue,
      'before-interactive-callback': () => setIsInteractive(true),
      'after-interactive-callback': () => setIsInteractive(false),
      'error-callback': rejectQueue,
      'unsupported-callback': rejectQueue,
      'timeout-callback': rejectQueue,
    };

    window.onloadTurnstileCallback = () => {
      turnstile.check = () => {
        if (turnstile.ignore) rejectQueue(new Error('Ignorado pelo usuário.'));

        if (!widgetIdRef.current) {
          widgetIdRef.current = window.turnstile.render(widgetRef.current, turnstileOptions);
        }

        window.turnstile.execute(widgetRef.current, turnstileOptions);
      };

      turnstile.queue.length && turnstile.check();
    };
  }, []);

  const confirm = useConfirm();

  const handleCancel = useCallback(async () => {
    if (
      !(await confirm({
        title: 'Executando verificação de segurança!',
        content: 'Recomendamos continuar para não bloquear funcionalidades do TabNews.',
        confirmButtonContent: 'Continuar',
        cancelButtonContent: 'Ignorar',
      }))
    ) {
      turnstile.ignore = true;
      setIsInteractive(false);
      window.turnstile.remove(widgetIdRef.current);
      turnstile.check();
    }
  }, [confirm]);

  return (
    <Box
      sx={{
        display: isInteractive ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '1px solid grey',
        zIndex: '1',
      }}
      onClick={handleCancel}>
      <Box sx={{ position: 'relative', height: '50vh' }}>
        <Text
          sx={{
            color: 'white',
            position: 'absolute',
            textAlign: 'center',
            width: '100%',
            fontSize: 2,
            fontWeight: 'bold',
            bottom: 4,
          }}>
          Executando verificação de segurança...
        </Text>
      </Box>
      <Box
        ref={widgetRef}
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'center',
        }}></Box>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit" />
    </Box>
  );
}

function replaceOriginalFetch() {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    let response = await originalFetch(...args);

    if (isChallenged(response)) {
      await new Promise((resolve, reject) => {
        turnstile.queue.push({ resolve, reject });
        turnstile.queue.length === 1 && turnstile.check();
      })
        .then(() => (response = originalFetch(...args)))
        .catch((error) => {
          const errorMessage = typeof error === 'string' ? error : error.message;
          console.warn(`[Turnstile] ${errorMessage}`);
        });
    }

    return checkFirewallResponse(response);
  };
}

function checkFirewallResponse(response) {
  if (!isBlocked(response)) return response;

  const { headers } = response;

  return new Response(
    JSON.stringify({
      message: BLOCKED_RESPONSE_MESSAGE,
      action: BLOCKED_RESPONSE_ACTION,
      error_id: headers?.has('cf-ray') ? `cf-ray: ${headers.get('cf-ray')}` : '',
      blocked: true,
    }),
    response
  );
}

function isChallenged({ headers }) {
  // Cloudflare returns a 403 status code with a `cf-mitigated: challenge`
  // header when the request fails the challenge.
  // Return `true` for simulate interactive challenges in development mode.
  // return true;
  return headers?.has('cf-mitigated') && headers.get('cf-mitigated') === 'challenge';
}

function isBlocked({ status, headers }) {
  // Cloudflare returns a 403 status code without Vercel headers when the request is blocked.
  return status === 403 && webserver.isProduction && !headers?.has('x-vercel-id');
}

function refetchQueue() {
  while (turnstile.queue.length) {
    turnstile.queue.shift().resolve();
  }
}

function rejectQueue(e) {
  while (turnstile.queue.length) {
    turnstile.queue.shift().reject(e);
  }
}
