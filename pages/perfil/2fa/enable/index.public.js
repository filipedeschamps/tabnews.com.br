import { Button, Flash, FormControl, TextInput } from '@primer/react';
import { Heading } from '@primer/react';
import { useRouter } from 'next/router';
import { DefaultLayout, useUser } from 'pages/interface';
import { useEffect, useRef, useState } from 'react';
import qrcode from 'qrcode';
export default function Enable2FAPage() {
  const { user, fetchUser, isLoading: userIsLoading } = useUser();
  const router = useRouter();
  let [secret, setSecret] = useState();
  let [qrcode_img, setQrCode] = useState();
  let [isLoading, setIsLoading] = useState(false);
  let codeRef = useRef('');
  let [invalidCode, setInvalidCode] = useState(false);
  useEffect(() => {
    fetch('/api/v1/user/2fa', { method: 'POST' })
      .then((res) => res.json())
      .then((secret) => {
        setSecret(secret);
        return secret;
      })
      .then((secret) => qrcode.toDataURL(secret.otpauth_url))
      .then((qrcode) => setQrCode(qrcode));
  }, []);
  async function onSubmit(e) {
    e.preventDefault();
    let code = codeRef.current.value;
    fetch('/api/v1/user/2fa/confirm', {
      body: JSON.stringify({ code }),
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (res.status == 200) {
          router.replace('/perfil');
        } else {
          setInvalidCode(true);
        }
        setIsLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsLoading(false);
      });
    setIsLoading(true);
  }
  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Editar Perfil' }}>
      {invalidCode ? (
        <Flash sx={{ mb: 5 }} variant="danger">
          O código 2FA está incorreto. Verifique a hora do seu dispositivo e o código.
        </Flash>
      ) : null}

      <Heading as="h1" sx={{}}>
        Ativar 2FA
      </Heading>
      {secret ? (
        <form onSubmit={onSubmit}>
          <FormControl id="qrcode">
            <p>Scaneie este código QR utilizando um aplicativo de 2FA (e.g. Authy):</p>
            {qrcode_img ? <img src={qrcode_img} /> : null}
          </FormControl>
          <FormControl id="2fa-secret">
            <p>
              Ou use este código: <code>{secret.base32}</code>
            </p>
          </FormControl>
          <hr style={{ opacity: '50%', margin: '1em 0' }} />
          <FormControl id="2fa-code-confirm">
            <FormControl.Label>Código 2FA</FormControl.Label>
            <FormControl.Caption>
              Isso é necessário para confirmar que o 2FA foi configurado corretamente.
            </FormControl.Caption>
            <TextInput
              ref={codeRef}
              name="code"
              size="large"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              block={true}
              aria-label="Código 2FA"
            />
          </FormControl>
          <FormControl>
            <FormControl.Label visuallyHidden>Confirmar 2FA</FormControl.Label>
            <Button
              variant="primary"
              size="large"
              type="submit"
              sx={{ width: '100%', mt: 5 }}
              disabled={isLoading}
              aria-label="Confirmar 2FA">
              Confirmar 2FA
            </Button>
          </FormControl>
        </form>
      ) : null}
    </DefaultLayout>
  );
}
