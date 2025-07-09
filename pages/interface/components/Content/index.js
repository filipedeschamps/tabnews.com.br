import { isTrustedDomain } from '@tabnews/helpers';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActionList,
  ActionMenu,
  Box,
  BranchName,
  Button,
  ButtonWithLoader,
  CharacterCount,
  Checkbox,
  Editor,
  Flash,
  FormControl,
  Heading,
  IconButton,
  Label,
  LabelGroup,
  Link,
  PastTime,
  ReadTime,
  Text,
  TextInput,
  Tooltip,
  useConfirm,
  Viewer,
} from '@/TabNewsUI';
import { KebabHorizontalIcon, LinkIcon, PencilIcon, ShareIcon, TrashIcon } from '@/TabNewsUI/icons';
import webserver from 'infra/webserver';
import { createErrorMessage, isValidJsonString, processNdJsonStream, useUser } from 'pages/interface';

const CONTENT_TITLE_PLACEHOLDER_EXAMPLES = [
  'e.g. Nova versão do Python é anunciada com melhorias de desempenho',
  'e.g. Desafios ao empreender como desenvolvedor',
  'e.g. Como funciona o conceito de ownership em Rust',
  'e.g. 5 livros fundamentais para desenvolvedores',
  'e.g. Como os jogos de Atari eram desenvolvidos',
  'e.g. Ferramentas para melhorar sua produtividade',
  'e.g. Como renomear uma branch local no Git?',
];

const BODY_MAX_LENGTH = 20_000;

export default function Content({ content, isPageRootOwner, mode = 'view', rootContent, viewFrame = false }) {
  const [componentMode, setComponentMode] = useState(mode);
  const [contentObject, setContentObject] = useState(content);
  const { user } = useUser();

  useEffect(() => {
    setComponentMode(mode);
  }, [mode]);

  useEffect(() => {
    setContentObject((contentObject) => {
      return { ...contentObject, ...content };
    });
  }, [content]);

  const localStorageKey = useMemo(() => {
    if (contentObject?.id) {
      return `content-edit-${contentObject.id}`;
    } else if (contentObject?.parent_id) {
      return `content-new-parent-${contentObject.parent_id}`;
    } else {
      return `content-new`;
    }
  }, [contentObject]);

  useEffect(() => {
    if (user && contentObject?.owner_id === user.id) {
      const localStorageContent = localStorage.getItem(localStorageKey);
      if (isValidJsonString(localStorageContent)) {
        setComponentMode('edit');
      }
    }
  }, [localStorageKey, user, contentObject]);

  if (componentMode === 'view') {
    return (
      <ViewMode
        setComponentMode={setComponentMode}
        contentObject={contentObject}
        isPageRootOwner={isPageRootOwner}
        viewFrame={viewFrame}
      />
    );
  } else if (componentMode === 'compact') {
    return <CompactMode setComponentMode={setComponentMode} contentObject={contentObject} rootContent={rootContent} />;
  } else if (componentMode === 'edit') {
    return (
      <EditMode
        contentObject={contentObject}
        setComponentMode={setComponentMode}
        setContentObject={setContentObject}
        localStorageKey={localStorageKey}
      />
    );
  } else if (componentMode === 'deleted') {
    return <DeletedMode viewFrame={viewFrame} />;
  }
}

function ViewModeOptionsMenu({ onDelete, onComponentModeChange }) {
  return (
    <Box sx={{ position: 'relative', minWidth: '28px' }}>
      <Box sx={{ position: 'absolute', right: 0 }}>
        {/* I've wrapped ActionMenu with this additional divs, to stop content from vertically
        flickering after this menu appears, because without `position: absolute` it increases the row height */}
        <ActionMenu>
          <ActionMenu.Anchor>
            <IconButton size="small" icon={KebabHorizontalIcon} aria-label="Editar conteúdo" />
          </ActionMenu.Anchor>

          <ActionMenu.Overlay>
            <ActionList>
              <ActionList.Item onSelect={() => onComponentModeChange('edit')}>
                <ActionList.LeadingVisual>
                  <PencilIcon />
                </ActionList.LeadingVisual>
                Editar
              </ActionList.Item>
              <ActionList.Item variant="danger" onSelect={onDelete}>
                <ActionList.LeadingVisual>
                  <TrashIcon />
                </ActionList.LeadingVisual>
                Apagar
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Box>
    </Box>
  );
}

function ViewMode({ setComponentMode, contentObject, isPageRootOwner, viewFrame }) {
  const { user, fetchUser } = useUser();
  const [globalErrorMessage, setGlobalErrorMessage] = useState(null);
  const confirm = useConfirm();

  const handleClickDelete = async () => {
    const confirmDelete = await confirm({
      title: 'Você tem certeza?',
      content: 'Deseja realmente apagar essa publicação?',
      cancelButtonContent: 'Cancelar',
      confirmButtonContent: 'Sim',
    });

    if (!confirmDelete) return;

    const data = {
      status: 'deleted',
    };

    const response = await fetch(`/api/v1/contents/${contentObject.owner_username}/${contentObject.slug}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseBody = await response.json();

    fetchUser();

    if (response.status === 200) {
      setComponentMode('deleted');
    } else {
      setGlobalErrorMessage({ error: responseBody });
    }
  };

  const isOptionsMenuVisible = user?.id === contentObject.owner_id || user?.features?.includes('update:content:others');

  return (
    <Box
      as="article"
      id={`${contentObject.owner_username}-${contentObject.slug}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        width: '100%',
        borderWidth: viewFrame ? 1 : 0,
        p: viewFrame ? 4 : 0,
        borderRadius: '6px',
        borderColor: 'border.default',
        borderStyle: 'solid',
        wordBreak: 'break-word',
      }}>
      <Box>
        {globalErrorMessage && <ErrorMessage {...globalErrorMessage} sx={{ mb: 4 }} />}

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              gap: 1,
              color: 'fg.muted',
            }}>
            <BranchName as="address" sx={{ fontStyle: 'normal', pt: 1 }}>
              <Link href={`/${contentObject.owner_username}`}>{contentObject.owner_username}</Link>
            </BranchName>
            <LabelGroup>
              {isPageRootOwner && (
                <Tooltip text="Autor do conteúdo principal da página" direction="n" sx={{ position: 'absolute' }}>
                  <Label>Autor</Label>
                </Tooltip>
              )}
              {contentObject.type === 'ad' && (
                <Tooltip text="Patrocinado com TabCash" direction="n" sx={{ position: 'absolute' }}>
                  <Label variant="success">Patrocinado</Label>
                </Tooltip>
              )}
            </LabelGroup>
            {!contentObject.parent_id && (
              <>
                <ReadTime text={contentObject.body} />
                {' · '}
              </>
            )}
            <Link
              href={`/${contentObject.owner_username}/${contentObject.slug}`}
              prefetch={false}
              sx={{ fontSize: 0, color: 'fg.muted' }}>
              <PastTime direction="n" date={contentObject.published_at} sx={{ position: 'absolute' }} />
            </Link>
          </Box>
          {isOptionsMenuVisible && (
            <ViewModeOptionsMenu onComponentModeChange={setComponentMode} onDelete={handleClickDelete} />
          )}
        </Box>

        {!contentObject.parent_id && contentObject.title && (
          <Heading sx={{ overflow: 'auto', wordWrap: 'break-word' }} as="h1">
            {contentObject.title}
          </Heading>
        )}
      </Box>
      <Box sx={{ overflow: 'hidden' }}>
        <Viewer value={contentObject.body} clobberPrefix={`${contentObject.owner_username}-content-`} />
      </Box>
      {contentObject.source_url && (
        <Box>
          <Text as="p" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
            <LinkIcon size={16} /> Fonte:{' '}
            <Link
              href={contentObject.source_url}
              rel={isTrustedDomain(contentObject.source_url) ? undefined : 'nofollow'}>
              {contentObject.source_url}
            </Link>
          </Text>
        </Box>
      )}
    </Box>
  );
}

function EditMode({ contentObject, setContentObject, setComponentMode, localStorageKey }) {
  const { user, fetchUser } = useUser();
  const router = useRouter();
  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);
  const [newData, setNewData] = useState({
    title: contentObject?.title || '',
    body: contentObject?.body || '',
    source_url: contentObject?.source_url || '',
    isSponsoredContent: contentObject?.type === 'ad',
  });
  const [titlePlaceholder, setTitlePlaceholder] = useState('');

  const confirm = useConfirm();

  useEffect(() => {
    const loadLocalStorage = (oldData) => {
      const data = localStorage.getItem(localStorageKey);

      if (!isValidJsonString(data)) {
        localStorage.removeItem(localStorageKey);
        return oldData;
      }

      return JSON.parse(data);
    };

    setNewData((data) => loadLocalStorage(data));

    function onFocus() {
      setNewData((oldData) => loadLocalStorage(oldData));
    }

    addEventListener('focus', onFocus);
    return () => removeEventListener('focus', onFocus);
  }, [localStorageKey]);

  useEffect(() => {
    setTitlePlaceholder(randomTitlePlaceholder());
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!user) {
        router.push(`/login?redirect=${router.asPath}`);
        return;
      }

      const confirmBodyValue =
        newData.body.split(/[a-z]{5,}/i, 6).length < 6
          ? await confirm({
              title: 'Tem certeza que deseja publicar essa mensagem curta?',
              content: (
                <Flash variant="warning">
                  ⚠ Atenção: Pedimos encarecidamente que{' '}
                  <Link href="https://www.tabnews.com.br/filipedeschamps/tentando-construir-um-pedaco-de-internet-mais-massa">
                    leia isso antes
                  </Link>{' '}
                  de fazer essa publicação.
                </Flash>
              ),
              cancelButtonContent: 'Cancelar',
              confirmButtonContent: 'Publicar',
              confirmButtonType: 'danger',
            })
          : true;

      if (!confirmBodyValue) return;

      setIsPosting(true);
      setErrorObject(undefined);

      const title = newData.title;
      const body = newData.body;
      const sourceUrl = newData.source_url;

      const requestMethod = contentObject?.id ? 'PATCH' : 'POST';
      const requestUrl = contentObject?.id
        ? `/api/v1/contents/${contentObject.owner_username}/${contentObject.slug}`
        : `/api/v1/contents`;
      const requestBody = {
        status: 'published',
        type: newData.isSponsoredContent ? 'ad' : 'content',
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

      fetch(requestUrl, {
        method: requestMethod,
        headers: {
          Accept: 'application/json, application/x-ndjson',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then(processResponse)
        .catch(() => {
          setGlobalErrorMessage({
            error: { message: 'Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.' },
          });
          setIsPosting(false);
        });

      function processResponse(response) {
        setGlobalErrorMessage(undefined);
        fetchUser();

        if (response.ok) {
          localStorage.removeItem(localStorageKey);
        } else {
          setIsPosting(false);
        }

        processNdJsonStream(response.body, getResponseBodyCallback(response));
      }

      function getResponseBodyCallback(response) {
        if (response.status === 200) {
          return (responseBody) => {
            setContentObject(responseBody);
            setComponentMode('view');
          };
        }

        if (response.status === 201) {
          return (responseBody) => {
            if (responseBody.message) {
              setGlobalErrorMessage({ error: responseBody });
              console.error(responseBody);
              return;
            }

            if (!responseBody.parent_id) {
              localStorage.setItem('justPublishedNewRootContent', true);
              router.push(`/${responseBody.owner_username}/${responseBody.slug}`);
              return;
            }

            setContentObject(responseBody);
            setComponentMode('view');
          };
        }

        if (response.status === 400) {
          return (responseBody) => {
            setErrorObject(responseBody);

            if (responseBody.key === 'slug') {
              setGlobalErrorMessage({ error: responseBody, omitErrorId: true });
            }
          };
        }

        if (response.status >= 401) {
          return (responseBody) => {
            setGlobalErrorMessage({ error: responseBody });
          };
        }
      }
    },
    [confirm, contentObject, localStorageKey, newData, router, setComponentMode, setContentObject, user, fetchUser],
  );

  const handleChange = useCallback(
    (event) => {
      setErrorObject(undefined);
      setNewData((oldData) => {
        const value =
          event.target?.name === 'isSponsoredContent' ? event.target.checked : (event.target?.value ?? event);
        const newData = { ...oldData, [event.target?.name || 'body']: value };
        localStorage.setItem(localStorageKey, JSON.stringify(newData));
        return newData;
      });
    },
    [localStorageKey],
  );

  const handleCancel = useCallback(async () => {
    const confirmCancel =
      newData.title || newData.body || newData.source_url
        ? await confirm({
            title: 'Tem certeza que deseja sair da edição?',
            content: 'Os dados não salvos serão perdidos.',
            cancelButtonContent: 'Cancelar',
            confirmButtonContent: 'Sim',
          })
        : true;

    if (!confirmCancel) return;

    setErrorObject(undefined);
    localStorage.removeItem(localStorageKey);
    const isPublished = contentObject?.status === 'published';
    const isChild = !!contentObject?.parent_id;
    if (isPublished) {
      setComponentMode('view');
    } else if (isChild) {
      setComponentMode('compact');
    } else if (router) {
      router.push('/');
    }
  }, [confirm, contentObject, localStorageKey, newData, router, setComponentMode]);

  const onKeyDown = useCallback(
    (event) => {
      if (isPosting) return;
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        handleSubmit(event);
      } else if (event.key === 'Escape') {
        handleCancel();
      }
    },
    [handleCancel, handleSubmit, isPosting],
  );

  return (
    <Box sx={{ mb: 4, width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {globalErrorMessage && <ErrorMessage {...globalErrorMessage} />}

          {!contentObject?.parent_id && (
            <FormControl id="title" required>
              <FormControl.Label>Título</FormControl.Label>
              <TextInput
                contrast
                sx={{ px: 2, '&:focus-within': { backgroundColor: 'canvas.default' } }}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                name="title"
                size="large"
                autoCorrect="off"
                autoCapitalize="sentences"
                spellCheck={true}
                placeholder={titlePlaceholder}
                autoFocus={true}
                block={true}
                value={newData.title}
              />

              {errorObject?.key === 'title' && (
                <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
              )}
            </FormControl>
          )}

          <FormControl id="body" required={!contentObject?.parent_id}>
            <FormControl.Label>{contentObject?.parent_id ? 'Seu comentário' : 'Corpo da publicação'}</FormControl.Label>
            <Editor
              isInvalid={errorObject?.key === 'body' || newData.body.length > BODY_MAX_LENGTH}
              value={newData.body}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              initialHeight={!contentObject?.parent_id ? 'calc(100vh - 410px)' : undefined}
              clobberPrefix={`${contentObject?.owner_username ?? user?.username}-content-`}
            />

            <Box sx={{ display: 'flex', width: '100%' }}>
              {errorObject?.key === 'body' && (
                <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
              )}

              <CharacterCount maxLength={BODY_MAX_LENGTH} value={newData.body} />
            </Box>
          </FormControl>

          {!contentObject?.parent_id && (
            <FormControl id="source_url">
              <FormControl.Label>Fonte</FormControl.Label>
              <TextInput
                contrast
                sx={{ px: 2, '&:focus-within': { backgroundColor: 'canvas.default' } }}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                name="source_url"
                size="large"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="https://origem.site/noticia"
                block={true}
                value={newData.source_url}
              />

              {errorObject?.key === 'source_url' && (
                <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
              )}
            </FormControl>
          )}

          {!contentObject?.id && !contentObject?.parent_id && (
            <FormControl>
              <Checkbox name="isSponsoredContent" onChange={handleChange} checked={newData.isSponsoredContent} />
              <FormControl.Label>
                Criar como publicação patrocinada. <Link href="/faq#publicacao-patrocinada">Saiba mais.</Link>
              </FormControl.Label>

              <FormControl.Caption>
                Serão consumidos 100 TabCash para criar a publicação patrocinada.
              </FormControl.Caption>
            </FormControl>
          )}

          {!contentObject?.parent_id && (
            <Text sx={{ fontSize: 1 }}>Os campos marcados com um asterisco (*) são obrigatórios.</Text>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {contentObject && (
              <Button
                variant="invisible"
                type="button"
                disabled={isPosting}
                sx={{ marginRight: 3, fontSize: 1, fontWeight: 'normal', cursor: 'pointer', color: 'fg.muted' }}
                aria-label="Cancelar alteração"
                onClick={handleCancel}>
                Cancelar
              </Button>
            )}
            <ButtonWithLoader
              variant="primary"
              type="submit"
              aria-label={isPosting ? 'Carregando...' : contentObject?.id ? 'Atualizar' : 'Publicar'}
              isLoading={isPosting}>
              {contentObject?.id ? 'Atualizar' : 'Publicar'}
            </ButtonWithLoader>
          </Box>
        </Box>
      </form>
    </Box>
  );
}

function CompactMode({ contentObject, rootContent, setComponentMode }) {
  const [isLinkCopied, setCopied] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useUser();
  const confirm = useConfirm();

  const isRootContent = rootContent.id === contentObject.parent_id;

  const handleClick = useCallback(async () => {
    if (user && !isLoading) {
      const confirmReply =
        contentObject?.owner_id === user.id
          ? await confirm({
              title: 'Você deseja responder ao seu próprio conteúdo?',
              content:
                'Ao responder à sua própria publicação, você não acumulará TabCoins. É recomendado editar o conteúdo existente caso precise complementar informações.',
              cancelButtonContent: 'Cancelar',
              confirmButtonContent: 'Responder',
              confirmButtonType: 'danger',
            })
          : true;

      if (!confirmReply) return;

      setComponentMode('edit');
    } else if (router) {
      router.push(`/login?redirect=${router.asPath}`);
    }
  }, [confirm, contentObject, isLoading, router, setComponentMode, user]);

  const handleShare = async () => {
    const title =
      isRootContent && rootContent.title
        ? rootContent.title
        : rootContent.title
          ? `Comentário de "${contentObject.owner_username}" em "${rootContent.title}"`
          : `Conteúdo de "${contentObject.owner_username}"`;
    const url = `${webserver.host}/${contentObject.owner_username}/${contentObject.slug}`;

    try {
      await navigator.share({ title, url });
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert('Não foi possível copiar o link. Verifique as permissões e se o navegador suporta a funcionalidade.');
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Tooltip text={`Responder para ${contentObject.owner_username}`} direction="n" sx={{ position: 'absolute' }}>
        <Button onClick={handleClick}>Responder</Button>
      </Tooltip>
      <Tooltip
        text={`Compartilhar ${isRootContent ? 'publicação' : 'comentário'}`}
        direction="n"
        sx={{ position: 'absolute' }}>
        <Button onClick={handleShare}>
          {isLinkCopied ? <Text sx={{ color: 'fg.muted' }}>Link copiado!</Text> : <ShareIcon size={16} />}
        </Button>
      </Tooltip>
    </Box>
  );
}

function DeletedMode({ viewFrame }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        borderWidth: viewFrame ? 1 : 0,
        p: viewFrame ? 2 : 0,
        borderRadius: '6px',
        borderColor: 'border.default',
        borderStyle: 'solid',
      }}>
      <Box sx={{ color: 'fg.muted', textAlign: 'center' }}>Conteúdo excluído</Box>
    </Box>
  );
}

function ErrorMessage({ error, omitErrorId, ...props }) {
  const isErrorWithReadMore =
    error.error_location_code === 'MODEL:CONTENT:CREDIT_OR_DEBIT_TABCOINS:NEGATIVE_USER_EARNINGS';

  return (
    <Flash variant="danger" {...props}>
      {createErrorMessage(error, { omitErrorId: omitErrorId || isErrorWithReadMore })}

      {isErrorWithReadMore && (
        <Text sx={{ display: 'block', mt: 1 }}>
          Para mais informações, leia:{' '}
          <Link href="/faq#erro-nova-publicacao">Não consigo criar novas publicações. O que fazer?</Link>
        </Text>
      )}
    </Flash>
  );
}

function randomTitlePlaceholder() {
  return CONTENT_TITLE_PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * CONTENT_TITLE_PLACEHOLDER_EXAMPLES.length)];
}
