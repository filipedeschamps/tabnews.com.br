import useSWR from 'swr';
import { useRouter } from 'next/router';
import { DefaultLayout, Content, useUser } from 'pages/interface/index.js';
import { Box, Heading, Flash, Link } from '@primer/react';
import React, { useEffect } from 'react';

export default function Post() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { data: contents } = useSWR(user ? `/api/v1/contents/${user.username}` : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login?redirect=${router.asPath}`);
    }
  }, [user, router, isLoading]);
  let [uploading, setUploading] = React.useState(0);
  async function upload(file) {
    if (file.type.startsWith('image/')) {
      setUploading((old) => old + 1);
      let file_data = await file.arrayBuffer();
      var headers = new Headers();
      // TODO: Change this to a enviroment variable
      // This could be hardcoded because it is not very dangerous to expose
      // But for the sake of security it should be configurable
      headers.append('Authorization', 'Client-ID 95693432b5027cd');

      var form_data = new FormData();
      const base64 = Buffer.from(new Uint8Array(file_data)).toString('base64');
      form_data.append('image', base64);

      var request_options = {
        method: 'POST',
        headers,
        body: form_data,
        redirect: 'follow',
      };

      let response = await (await fetch('https://api.imgur.com/3/image', request_options)).json();
      setUploading((old) => old - 1);
      return response.data.link;
    }
  }
  /**
   * Uploads all dropped images
   * @param {DragEvent} event Drag Event
   * @param {(String) => void} append A function that appends text to the editor
   */
  async function onDragNDrop(event, append) {
    if (event.dataTransfer == null) {
      return;
    }
    event.preventDefault();
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      const file = event.dataTransfer.files.item(i);
      append('![Uploaded Image](' + (await upload(file)) + ')');
    }
  }

  return (
    <DefaultLayout metadata={{ title: 'Publicar novo conteúdo' }}>
      {contents?.length === 0 && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Flash variant="warning">
            ⚠ Atenção: Pedimos encarecidamente que{' '}
            <Link href="https://www.tabnews.com.br/filipedeschamps/tentando-construir-um-pedaco-de-internet-mais-massa">
              leia isso antes
            </Link>{' '}
            de fazer sua primeira publicação.
          </Flash>
        </Box>
      )}
      {uploading > 0 && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Flash variant="default">
            Subindo {uploading} {uploading == 1 ? 'imagem' : 'imagens'}...
          </Flash>
        </Box>
      )}

      <Heading as="h1" sx={{ mb: 3 }}>
        Publicar novo conteúdo
      </Heading>
      <Content mode="edit" dropEvent={onDragNDrop} />
    </DefaultLayout>
  );
}
