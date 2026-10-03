import { isTrustedDomain } from '@tabnews/helpers';
import { clsx } from 'clsx';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ActionList,
  ActionMenu,
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
  TextInput,
  Tooltip,
  useConfirm,
  Viewer,
} from '@/TabNewsUI';
import { KebabHorizontalIcon, LinkIcon, PencilIcon, ShareIcon, TrashIcon } from '@/TabNewsUI/icons';
import webserver from 'infra/webserver';
import { createErrorMessage, getLoginUrl, isValidJsonString, processNdJsonStream, useUser } from 'interface';

import classes from './index.module.css';

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
const CONFIRM_UNSAVED_CHANGES_MESSAGE = 'Existem dados não salvos. Deseja sair da página e perder as alterações?';

export default function Content({ children, content, isPageRootOwner, mode = 'view', rootContent, viewFrame = false }) {
  const [componentMode, setComponentMode] = useState(mode);
  const [contentObject, setContentObject] = useState(content);
  const { user } = useUser();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setComponentMode('edit');
      }
    }
  }, [localStorageKey, user, contentObject]);

  if (componentMode === 'deleted') {
    return <DeletedMode viewFrame={viewFrame} />;
  }

  // The reply box keeps its own actions in place while the editor is open and after the reply is
  // published, so the content being replied to never loses its share button.
  if (mode === 'compact') {
    return (
      <ReplyBox
        componentMode={componentMode}
        content={content}
        contentObject={contentObject}
        localStorageKey={localStorageKey}
        rootContent={rootContent}
        setComponentMode={setComponentMode}
        setContentObject={setContentObject}
      />
    );
  }

  if (componentMode === 'view') {
    return (
      <ViewMode
        setComponentMode={setComponentMode}
        contentObject={contentObject}
        isPageRootOwner={isPageRootOwner}
        viewFrame={viewFrame}>
        {children}
      </ViewMode>
    );
  }

  return (
    <EditMode
      contentObject={contentObject}
      setComponentMode={setComponentMode}
      setContentObject={setContentObject}
      localStorageKey={localStorageKey}
    />
  );
}

function ViewModeOptionsMenu({ onDelete, onComponentModeChange }) {
  return (
    <div className={classes.OptionsMenuWrapper}>
      <div className={classes.OptionsMenuAnchor}>
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
      </div>
    </div>
  );
}

function ViewMode({ children, setComponentMode, contentObject, isPageRootOwner, viewFrame }) {
  const { user, fetchUser } = useUser();
  const [globalErrorMessage, setGlobalErrorMessage] = useState(null);
  const confirm = useConfirm();

  const handleClickDelete = async () => {
    const confirmDelete = await confirm({
      title: 'Você tem certeza?',
      content: 'Deseja realmente apagar essa publicação?',
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
    <article
      id={`${contentObject.owner_username}-${contentObject.slug}`}
      className={clsx(classes.Article, viewFrame && classes.ArticleFramed)}>
      <div>
        {globalErrorMessage && <ErrorMessage {...globalErrorMessage} className={classes.HeaderError} />}

        <div className={classes.HeaderRow}>
          <div className={classes.Meta}>
            <BranchName as="address" className={classes.Address}>
              <Link href={`/${contentObject.owner_username}`}>{contentObject.owner_username}</Link>
            </BranchName>
            <LabelGroup>
              {isPageRootOwner && (
                <Tooltip text="Autor do conteúdo principal da página" direction="n" position="absolute">
                  <Label>Autor</Label>
                </Tooltip>
              )}
              {contentObject.type === 'ad' && (
                <Tooltip text="Patrocinado com TabCash" direction="n" position="absolute">
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
              className={classes.PublishedAtLink}>
              <PastTime direction="n" date={contentObject.published_at} position="absolute" />
            </Link>
          </div>
          {isOptionsMenuVisible && (
            <ViewModeOptionsMenu onComponentModeChange={setComponentMode} onDelete={handleClickDelete} />
          )}
        </div>

        {!contentObject.parent_id && contentObject.title && (
          <Heading className={classes.Title} as="h1">
            {contentObject.title}
          </Heading>
        )}
      </div>
      <div className={classes.ViewerWrapper}>
        <Viewer value={contentObject.body} clobberPrefix={`${contentObject.owner_username}-content-`} />
      </div>
      {contentObject.source_url && (
        <div>
          <p className={classes.SourceText}>
            <LinkIcon size={16} /> Fonte:{' '}
            <Link
              href={contentObject.source_url}
              rel={isTrustedDomain(contentObject.source_url) ? undefined : 'nofollow'}>
              {contentObject.source_url}
            </Link>
          </p>
        </div>
      )}
      {children}
    </article>
  );
}

function EditMode({ contentObject, setContentObject, setComponentMode, localStorageKey, onPublish }) {
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
  const [titlePlaceholder] = useState(randomTitlePlaceholder);

  const confirm = useConfirm();
  const initialData = useMemo(
    () => ({
      title: contentObject?.title || '',
      body: contentObject?.body || '',
      source_url: contentObject?.source_url || '',
      isSponsoredContent: contentObject?.type === 'ad',
    }),
    [contentObject?.body, contentObject?.source_url, contentObject?.title, contentObject?.type],
  );
  const hasUnsavedChanges = useMemo(() => {
    if (isPosting) return false;

    return (
      newData.title !== initialData.title ||
      newData.body !== initialData.body ||
      newData.source_url !== initialData.source_url ||
      newData.isSponsoredContent !== initialData.isSponsoredContent
    );
  }, [initialData, isPosting, newData]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleRouteChangeStart = (url) => {
      if (url === router.asPath || window.confirm(CONFIRM_UNSAVED_CHANGES_MESSAGE)) return;

      const error = new Error('Route change aborted due to unsaved content.');
      router.events.emit('routeChangeError', error, url);
      throw error;
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => router.events.off('routeChangeStart', handleRouteChangeStart);
  }, [hasUnsavedChanges, router]);

  useEffect(() => {
    const loadLocalStorage = (oldData) => {
      const data = localStorage.getItem(localStorageKey);

      if (!isValidJsonString(data)) {
        localStorage.removeItem(localStorageKey);
        return oldData;
      }

      return JSON.parse(data);
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewData((data) => loadLocalStorage(data));

    function onFocus() {
      setNewData((oldData) => loadLocalStorage(oldData));
    }

    addEventListener('focus', onFocus);
    return () => removeEventListener('focus', onFocus);
  }, [localStorageKey]);
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!user) {
        router.push(getLoginUrl(router.asPath));
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
              setIsPosting(false);
              return;
            }

            if (!responseBody.parent_id) {
              localStorage.setItem('justPublishedNewRootContent', true);
              router.push(`/${responseBody.owner_username}/${responseBody.slug}`);
              return;
            }

            setComponentMode('compact');
            onPublish(responseBody);
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
    [
      confirm,
      contentObject,
      localStorageKey,
      newData,
      onPublish,
      router,
      setComponentMode,
      setContentObject,
      user,
      fetchUser,
    ],
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
    <div className={classes.EditForm}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }} noValidate>
        <div className={classes.EditFields}>
          {globalErrorMessage && <ErrorMessage {...globalErrorMessage} />}

          {!contentObject?.parent_id && (
            <FormControl id="title" required>
              <FormControl.Label>Título</FormControl.Label>
              <TextInput
                className={classes.TextInput}
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
                suppressHydrationWarning={true}
              />

              {errorObject?.key === 'title' && (
                <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
              )}
            </FormControl>
          )}

          <FormControl id="body" required={!contentObject?.parent_id}>
            <FormControl.Label>{contentObject?.parent_id ? 'Seu comentário' : 'Corpo da publicação'}</FormControl.Label>
            <Editor
              autoFocus={!!contentObject?.parent_id}
              isInvalid={errorObject?.key === 'body' || newData.body.length > BODY_MAX_LENGTH}
              value={newData.body}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              initialHeight={!contentObject?.parent_id ? 'calc(100vh - 410px)' : undefined}
              clobberPrefix={`${contentObject?.owner_username ?? user?.username}-content-`}
            />

            {!contentObject?.parent_id && (newData.body?.startsWith('# ') || newData.body?.startsWith('<h1>')) && (
              <Flash variant="warning" className={classes.BodyDicaFlash}>
                <strong>⚠️ Dica de formatação:</strong> O título da publicação já é renderizado como título principal
                (H1). Recomendamos usar <code>##</code> (H2) para subtítulos no corpo do texto.
              </Flash>
            )}

            <div className={classes.BodyFooter}>
              {errorObject?.key === 'body' && (
                <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
              )}

              <CharacterCount maxLength={BODY_MAX_LENGTH} value={newData.body} />
            </div>
          </FormControl>

          {!contentObject?.parent_id && (
            <FormControl id="source_url">
              <FormControl.Label>Fonte</FormControl.Label>
              <TextInput
                className={classes.TextInput}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                name="source_url"
                size="large"
                autoCorrect="off"
                autoCapitalize="none"
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
            <span className={classes.RequiredFieldsNote}>
              Os campos marcados com um asterisco (*) são obrigatórios.
            </span>
          )}

          <div className={classes.EditActions}>
            {contentObject && (
              <Button
                variant="invisible"
                type="button"
                disabled={isPosting}
                className={classes.CancelButton}
                onClick={handleCancel}>
                Cancelar
              </Button>
            )}
            <ButtonWithLoader variant="primary" type="submit" isLoading={isPosting}>
              {contentObject?.id ? 'Atualizar' : 'Publicar'}
            </ButtonWithLoader>
          </div>
        </div>
      </form>
    </div>
  );
}

function ReplyBox({
  componentMode,
  content,
  contentObject,
  localStorageKey,
  rootContent,
  setComponentMode,
  setContentObject,
}) {
  // The published reply is kept here, instead of replacing the content of the reply box, so the box
  // goes on describing the content being replied to. Only one reply is accepted, since replying
  // twice at the same level is not something to encourage.
  const [publishedReply, setPublishedReply] = useState(null);

  return (
    <div className={classes.ReplyWrapper}>
      <div className={classes.CompactWrapper}>
        <ReplyButton
          contentObject={content}
          isReplying={componentMode === 'edit' || !!publishedReply}
          setComponentMode={setComponentMode}
        />
        <ShareButton content={content} rootContent={rootContent} />
      </div>

      {componentMode === 'edit' && (
        <EditMode
          contentObject={contentObject}
          setComponentMode={setComponentMode}
          setContentObject={setContentObject}
          localStorageKey={localStorageKey}
          onPublish={setPublishedReply}
        />
      )}

      {publishedReply && (
        <Content content={publishedReply} mode="view" viewFrame={true}>
          <div className={classes.ArticleActions}>
            <ShareButton content={publishedReply} rootContent={rootContent} />
          </div>
        </Content>
      )}
    </div>
  );
}

function ReplyButton({ contentObject, isReplying, setComponentMode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const confirm = useConfirm();

  const handleClick = useCallback(async () => {
    if (user && !isLoading) {
      const confirmReply =
        contentObject?.owner_id === user.id
          ? await confirm({
              title: 'Você deseja responder ao seu próprio conteúdo?',
              content:
                'Ao responder à sua própria publicação, você não acumulará TabCoins. É recomendado editar o conteúdo existente caso precise complementar informações.',
              confirmButtonContent: 'Responder',
              confirmButtonType: 'danger',
            })
          : true;

      if (!confirmReply) return;

      setComponentMode('edit');
    } else if (router) {
      router.push(getLoginUrl(router.asPath));
    }
  }, [confirm, contentObject, isLoading, router, setComponentMode, user]);

  return (
    <Tooltip text={`Responder para ${contentObject.owner_username}`} direction="n" position="absolute">
      <Button onClick={handleClick} disabled={isReplying} aria-expanded={isReplying}>
        Responder
      </Button>
    </Tooltip>
  );
}

function ShareButton({ content, rootContent }) {
  const [isLinkCopied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef(null);
  // A published content is identified by its own `id`, while the placeholder of the reply box
  // points to the content it replies to through `parent_id`.
  const isRootContent = rootContent.id === (content.id ?? content.parent_id);
  const shareLabel = `Compartilhar ${isRootContent ? 'publicação' : 'comentário'}`;

  useEffect(() => () => clearTimeout(copiedTimeoutRef.current), []);

  const handleShare = async () => {
    const title =
      isRootContent && rootContent.title
        ? rootContent.title
        : rootContent.title
          ? `Comentário de "${content.owner_username}" em "${rootContent.title}"`
          : `Conteúdo de "${content.owner_username}"`;
    const url = `${webserver.host}/${content.owner_username}/${content.slug}`;

    try {
      await navigator.share({ title, url });
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        alert('Não foi possível copiar o link. Verifique as permissões e se o navegador suporta a funcionalidade.');
      }
    }
  };

  return (
    <Tooltip text={shareLabel} direction="n" position="absolute">
      <Button onClick={handleShare} aria-label={isLinkCopied ? 'Link copiado!' : shareLabel}>
        {isLinkCopied ? (
          <span className={classes.LinkCopiedText} role="status">
            Link copiado!
          </span>
        ) : (
          <ShareIcon size={16} aria-hidden="true" />
        )}
      </Button>
    </Tooltip>
  );
}

function DeletedMode({ viewFrame }) {
  return (
    <div className={clsx(classes.DeletedWrapper, viewFrame && classes.DeletedWrapperFramed)}>
      <div className={classes.DeletedText}>Conteúdo excluído</div>
    </div>
  );
}

function ErrorMessage({ error, omitErrorId, ...props }) {
  const isErrorWithReadMore =
    error.error_location_code === 'MODEL:CONTENT:CREDIT_OR_DEBIT_TABCOINS:NEGATIVE_USER_EARNINGS';

  return (
    <Flash variant="danger" {...props}>
      {createErrorMessage(error, { omitErrorId: omitErrorId || isErrorWithReadMore })}

      {isErrorWithReadMore && (
        <span className={classes.ReadMoreText}>
          Para mais informações, leia:{' '}
          <Link href="/faq#erro-nova-publicacao">Não consigo criar novas publicações. O que fazer?</Link>
        </span>
      )}
    </Flash>
  );
}

function randomTitlePlaceholder() {
  return CONTENT_TITLE_PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * CONTENT_TITLE_PLACEHOLDER_EXAMPLES.length)];
}
