import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

import {
  FormControl,
  Box,
  Button,
  TextInput,
  Flash,
  Heading,
  Text,
  Link,
  BranchName,
  ActionMenu,
  ActionList,
  IconButton,
  Tooltip,
} from '@primer/react';
import { KebabHorizontalIcon, PencilIcon, IssueDraftIcon, TrashIcon, LinkIcon } from '@primer/octicons-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { pt } from 'date-fns/locale';

import { useUser } from 'pages/interface/index.js';

// Markdown Editor dependencies:
import { Editor, Viewer } from '@bytemd/react';
import gfmPlugin from '@bytemd/plugin-gfm';
import highlightSsrPlugin from '@bytemd/plugin-highlight-ssr';
import mermaidPlugin from '@bytemd/plugin-mermaid';
import breaksPlugin from '@bytemd/plugin-breaks';
import gemojiPlugin from '@bytemd/plugin-gemoji';
import 'bytemd/dist/index.min.css';
import 'highlight.js/styles/github.css';
import 'github-markdown-css/github-markdown-light.css';

export default function Content({ content, mode = 'view', viewFrame = false }) {
  const [componentMode, setComponentMode] = useState(mode);
  const [contentObject, setContentObject] = useState(content);
  const { user, isLoading } = useUser();

  useEffect(() => {
    setComponentMode(mode);
  }, [mode]);

  useEffect(() => {
    setContentObject(content);
  }, [content]);

  const bytemdPluginList = [gfmPlugin(), highlightSsrPlugin(), mermaidPlugin(), breaksPlugin(), gemojiPlugin()];

  if (componentMode === 'view') {
    return <ViewMode />;
  }

  if (componentMode === 'edit') {
    return <EditMode />;
  }

  if (componentMode === 'compact') {
    return <CompactMode />;
  }

  function ViewMode() {
    const [publishedSinceText, setPublishedSinceText] = useState();

    useEffect(() => {
      const publishedSince = formatDistanceToNowStrict(new Date(contentObject.published_at), {
        addSuffix: false,
        includeSeconds: true,
        locale: pt,
      });
      setPublishedSinceText(`${publishedSince} atrás`);
    }, []);

    function ViewModeOptionsMenu() {
      return (
        <ActionMenu>
          <ActionMenu.Anchor>
            <IconButton size="small" icon={KebabHorizontalIcon} aria-label="Editar conteúdo" />
          </ActionMenu.Anchor>

          <ActionMenu.Overlay>
            <ActionList>
              <ActionList.Item
                onClick={() => {
                  setComponentMode('edit');
                }}>
                <ActionList.LeadingVisual>
                  <PencilIcon />
                </ActionList.LeadingVisual>
                Editar
              </ActionList.Item>
              <ActionList.Item
                onClick={() => {
                  alert('Não implementado.');
                }}>
                <ActionList.LeadingVisual>
                  <IssueDraftIcon />
                </ActionList.LeadingVisual>
                Despublicar
              </ActionList.Item>
              <ActionList.Item
                variant="danger"
                onClick={() => {
                  alert('Não implementado.');
                }}>
                <ActionList.LeadingVisual>
                  <TrashIcon />
                </ActionList.LeadingVisual>
                Deletar
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          borderWidth: viewFrame ? 1 : 0,
          p: viewFrame ? 4 : 0,
          borderRadius: '6px',
          borderColor: 'border.default',
          borderStyle: 'solid',
        }}>
        <Box>
          <Box sx={{ height: 25, display: 'flex', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 'auto' }}>
              <BranchName sx={{ mr: 2 }} href={`/${contentObject.username}`}>
                {contentObject.username}
              </BranchName>

              <Tooltip
                aria-label={new Date(contentObject.published_at).toLocaleString('pt-BR', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}>
                <Link href={`/${contentObject.username}/${contentObject.slug}`} sx={{ fontSize: 0, color: 'fg.muted' }}>
                  {publishedSinceText}
                </Link>
              </Tooltip>
            </Box>
            <Box>{user && user.id === contentObject.owner_id && ViewModeOptionsMenu()}</Box>
          </Box>

          {!contentObject?.parent_id && contentObject?.title && <Heading as="h1">{contentObject.title}</Heading>}
        </Box>
        <Box>
          <Viewer value={contentObject.body} plugins={bytemdPluginList} />
        </Box>
        {contentObject.source_url && (
          <Box>
            <Text as="p" fontWeight="bold">
              <LinkIcon size={16} /> Fonte: <Link href={contentObject.source_url}>{contentObject.source_url}</Link>
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  function EditMode() {
    const router = useRouter();
    useEffect(() => {
      if (!isLoading && !user.username) {
        // TODO: re-implement this after local changes
        // are saved in local storage.
        // router.push('/login');

        setGlobalErrorMessage('Você precisa estar logado para criar ou editar um conteúdo.');
      } else {
        clearErrors();
      }
    }, []);

    const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [errorObject, setErrorObject] = useState(undefined);
    const [newData, setNewData] = useState({
      title: contentObject?.title || '',
      body: contentObject?.body || '',
      source_url: contentObject?.source_url || '',
    });

    const localStorageKey = useMemo(() => {
      if (contentObject?.id) {
        return `content-edit-${contentObject.id}`;
      } else if (contentObject?.parent_id) {
        return `content-new-parent-${contentObject.parent_id}`;
      } else {
        return `content-new`;
      }
    }, []);

    function loadLocalStorage(oldData) {
      const data = localStorage.getItem(localStorageKey);

      if (!isValidJsonString(data)) {
        localStorage.removeItem(localStorageKey);
        return oldData;
      }

      return JSON.parse(data);
    }

    useEffect(() => {
      setNewData(loadLocalStorage(newData));

      function onFocus() {
        setNewData((oldData) => loadLocalStorage(oldData));
      }

      addEventListener('focus', onFocus);
      return () => removeEventListener('focus', onFocus);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function clearErrors() {
      setErrorObject(undefined);
    }

    async function handleSubmit(event) {
      event.preventDefault();
      setIsPosting(true);
      setErrorObject(undefined);

      const title = newData.title;
      const body = newData.body;
      const sourceUrl = newData.source_url;

      const requestMethod = contentObject?.id ? 'PATCH' : 'POST';
      const requestUrl = contentObject?.id
        ? `/api/v1/contents/${user.username}/${contentObject.slug}`
        : `/api/v1/contents`;
      const requestBody = {
        status: 'published',
      };

      if (title || contentObject?.title) {
        requestBody.title = title;
      }

      if (body || contentObject?.body) {
        requestBody.body = body;
      }

      if (sourceUrl || contentObject?.source_url) {
        requestBody.source_url = sourceUrl || null;
      }

      if (contentObject?.parent_id) {
        requestBody.parent_id = contentObject.parent_id;
      }

      try {
        const response = await fetch(requestUrl, {
          method: requestMethod,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        setGlobalErrorMessage(undefined);

        const responseBody = await response.json();

        if (response.status === 200) {
          localStorage.removeItem(localStorageKey);
          setContentObject(responseBody);
          setComponentMode('view');
          return;
        }

        if (response.status === 201) {
          localStorage.removeItem(localStorageKey);
          if (!responseBody.parent_id) {
            localStorage.setItem('justPublishedNewRootContent', true);
            router.push(`/${responseBody.username}/${responseBody.slug}`);
            return;
          }

          setContentObject(responseBody);
          setComponentMode('view');
          return;
        }

        if (response.status === 400) {
          setErrorObject(responseBody);

          if (responseBody.key === 'slug') {
            setGlobalErrorMessage(`${responseBody.message} ${responseBody.action}`);
          }
          setIsPosting(false);
          return;
        }

        if (response.status === 401 || response.status === 403) {
          setGlobalErrorMessage(`${responseBody.message} ${responseBody.action}`);
          setIsPosting(false);
          return;
        }

        if (response.status >= 500) {
          setGlobalErrorMessage(`${responseBody.message} Informe ao suporte este valor: ${responseBody.error_id}`);
          setIsPosting(false);
          return;
        }
      } catch (error) {
        console.log(error);
        setGlobalErrorMessage('Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.');
        setIsPosting(false);
      }
    }

    const handleChange = (event) => {
      clearErrors();
      setNewData((oldData) => {
        const newData = { ...oldData, [event.target?.name || 'body']: event.target?.value ?? event };
        localStorage.setItem(localStorageKey, JSON.stringify(newData));
        return newData;
      });
    };

    function handleCancel() {
      if (
        newData.body &&
        !window.confirm('Tem certeza que deseja sair da edição?\n Os dados não salvos serão perdidos.')
      )
        return;
      clearErrors();
      localStorage.removeItem(localStorageKey);
      const isPublished = contentObject?.status === 'published';
      setComponentMode(isPublished ? 'view' : 'compact');
    }

    return (
      <Box sx={{ mb: 4, width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {globalErrorMessage && <Flash variant="danger">{globalErrorMessage}</Flash>}

            {!contentObject?.parent_id && (
              <FormControl id="title">
                <FormControl.Label visuallyHidden>Título</FormControl.Label>
                <TextInput
                  onChange={handleChange}
                  name="title"
                  size="large"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="Título"
                  aria-label="Título"
                  // Autofocus: na prática já estava implementado
                  // através da referência do input no useEffect
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={true}
                  value={newData.title}
                />

                {errorObject?.key === 'title' && (
                  <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
                )}
              </FormControl>
            )}

            {/* <Editor> is not part of Primer, so error messages and styling need to be created manually */}
            <FormControl id="body">
              <FormControl.Label visuallyHidden>Corpo</FormControl.Label>
              <Box className={errorObject?.key === 'body' ? 'is-invalid' : ''}>
                <Editor value={newData.body} plugins={bytemdPluginList} onChange={handleChange} mode="tab" />
              </Box>

              {errorObject?.key === 'body' && (
                <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
              )}
            </FormControl>

            {!contentObject?.parent_id && (
              <FormControl id="source_url">
                <FormControl.Label visuallyHidden>Fonte (opcional)</FormControl.Label>
                <TextInput
                  onChange={handleChange}
                  name="source_url"
                  size="large"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="Fonte (opcional)"
                  aria-label="Fonte (opcional)"
                  value={newData.source_url}
                />

                {errorObject?.key === 'source_url' && (
                  <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
                )}
              </FormControl>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {contentObject && (
                <Link
                  sx={{ marginRight: 3, fontSize: 1, cursor: 'pointer', color: 'fg.muted' }}
                  aria-label="Cancelar alteração"
                  onClick={handleCancel}>
                  Cancelar
                </Link>
              )}
              <Button variant="primary" type="submit" disabled={isPosting} aria-label="Publicar">
                {contentObject && contentObject.id ? 'Atualizar' : 'Publicar'}
              </Button>
            </Box>
          </Box>
        </form>

        <style global jsx>{`
          .bytemd {
            height: ${mode === 'edit' ? 'calc(100vh - 350px)' : 'calc(100vh - 600px)'};
            min-height: 200px;
            border-radius: 6px;
          }

          .bytemd:focus-within {
            border-color: #0969da;
            box-shadow: 0 0 0 3px rgb(9 105 218 / 30%);
          }

          .is-invalid .bytemd {
            border-color: #cf222e;
          }

          .is-invalid .bytemd:focus-within {
            border-color: #cf222e;
            box-shadow: 0 0 0 3px rgb(164 14 38 / 40%);
          }

          .bytemd .bytemd-toolbar {
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
          }

          .bytemd .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(1),
          .bytemd .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(2),
          .bytemd .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(4) {
            display: none;
          }

          .bytemd .bytemd-status {
            display: none;
          }

          .bytemd-fullscreen.bytemd {
            z-index: 100;
          }
        `}</style>
      </Box>
    );
  }

  function CompactMode() {
    const router = useRouter();

    const handleClick = useCallback(() => {
      if (user?.username && !isLoading) {
        setComponentMode('edit');
      } else {
        router.push(`/login?redirect=${router.asPath}`);
      }
    }, [router]);

    return (
      <Button
        sx={{
          maxWidth: 'fit-content',
        }}
        onClick={handleClick}>
        Responder
      </Button>
    );
  }
}

function isValidJsonString(jsonString) {
  if (!(jsonString && typeof jsonString === 'string')) {
    return false;
  }

  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}
