import { useRouter } from 'next/router';

import {
  ActionList,
  ActionMenu,
  Box,
  HeaderLink,
  IconButton,
  Link,
  PrimerHeader,
  TabCashCount,
  TabCoinCount,
  ThemeSelector,
  ThemeSwitcher,
  Tooltip,
  Truncate,
  useSearchBox,
} from '@/TabNewsUI';
import { CgTab, HomeIcon, PersonFillIcon, PlusIcon } from '@/TabNewsUI/icons';
import { useUser } from 'pages/interface';

export default function HeaderComponent() {
  const { user, isLoading, logout } = useUser();
  const { asPath } = useRouter();
  const { onClickSearchButton, SearchBarButton, SearchBarMenuItem, SearchBoxOverlay, SearchIconButton } =
    useSearchBox();

  const loginUrl =
    !asPath || user || asPath.startsWith('/cadastro')
      ? '/login'
      : asPath.startsWith('/login')
      ? asPath
      : `/login?redirect=${asPath}`;

  const activeLinkStyle = {
    textDecoration: 'underline',
    textUnderlineOffset: 6,
  };

  return (
    <PrimerHeader
      id="header"
      sx={{
        minWidth: 'max-content',
        px: [2, null, null, 3],
      }}>
      <SearchBoxOverlay />
      <PrimerHeader.Item>
        <HeaderLink href="/" aria-label="Voltar para a página inicial">
          <CgTab size={32} />
          <Box sx={{ ml: 2, display: ['none', 'block'] }}>TabNews</Box>
        </HeaderLink>
      </PrimerHeader.Item>

      <PrimerHeader.Item>
        <HeaderLink href="/" sx={asPath === '/' || asPath.startsWith('/pagina') ? activeLinkStyle : undefined}>
          Relevantes
        </HeaderLink>
      </PrimerHeader.Item>

      <PrimerHeader.Item full>
        <HeaderLink href="/recentes" sx={asPath.startsWith('/recentes') ? activeLinkStyle : undefined}>
          Recentes
        </HeaderLink>
      </PrimerHeader.Item>

      {!isLoading && (
        <PrimerHeader.Item
          sx={{
            display: user ? ['none', 'flex'] : 'flex',
            mr: 1,
          }}>
          <SearchBarButton />
          <SearchIconButton />
        </PrimerHeader.Item>
      )}

      {!isLoading && !user && (
        <>
          <PrimerHeader.Item sx={{ mr: 2 }}>
            <ThemeSwitcher />
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['none', 'flex'] }}>
            <HeaderLink href={loginUrl}>Login</HeaderLink>
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['none', 'flex'], mr: 1 }}>
            <HeaderLink href="/cadastro">Cadastrar</HeaderLink>
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['flex', 'none'], mr: 1 }}>
            <HeaderLink href={loginUrl}>Entrar</HeaderLink>
          </PrimerHeader.Item>
        </>
      )}

      {user && (
        <>
          <PrimerHeader.Item
            sx={{
              display: ['none', 'flex'],
              m: 2,
            }}>
            <Tooltip aria-label="Publicar novo conteúdo" direction="s" noDelay={true} wrap={true}>
              <HeaderLink href="/publicar">
                <PlusIcon size={16} />
              </HeaderLink>
            </Tooltip>
          </PrimerHeader.Item>

          <PrimerHeader.Item
            sx={{
              mr: 2,
              fontSize: 0,
              fontWeight: 'bold',
            }}>
            <TabCoinCount amount={user.tabcoins} sx={{ color: 'fg.onEmphasis', pl: 2, pr: 1 }} />
          </PrimerHeader.Item>

          <PrimerHeader.Item
            sx={{
              mr: 2,
              fontSize: 0,
              fontWeight: 'bold',
            }}>
            <TabCashCount amount={user.tabcash} sx={{ color: 'fg.onEmphasis', pr: 1 }} />
          </PrimerHeader.Item>

          <PrimerHeader.Item sx={{ mr: 0 }}>
            <ActionMenu>
              <ActionMenu.Anchor>
                <IconButton
                  aria-label="Abrir opções do Perfil"
                  icon={PersonFillIcon}
                  size="small"
                  sx={{ '&:focus-visible': { outline: '2px solid #FFF' } }}
                />
              </ActionMenu.Anchor>

              <ActionMenu.Overlay>
                <ActionList>
                  <ActionList.LinkItem as={Link} href={`/${user.username}`}>
                    <ActionList.LeadingVisual>
                      <HomeIcon size={16} />
                    </ActionList.LeadingVisual>
                    <Truncate>{user.username}</Truncate>
                  </ActionList.LinkItem>
                  <ActionList.Divider />
                  <ActionList.LinkItem as={Link} href="/publicar">
                    Publicar novo conteúdo
                  </ActionList.LinkItem>
                  <ActionList.LinkItem as={Link} href={`/${user.username}`}>
                    Meus conteúdos
                  </ActionList.LinkItem>
                  <ActionList.LinkItem as={Link} href="/perfil">
                    Editar perfil
                  </ActionList.LinkItem>
                  <ActionList.Divider />

                  <ActionList.Item sx={{ display: [, 'none'] }} onSelect={onClickSearchButton}>
                    <SearchBarMenuItem />
                  </ActionList.Item>

                  <ThemeSelector />
                  <ActionList.Divider />

                  <ActionList.Item variant="danger" onSelect={logout}>
                    Deslogar
                  </ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
          </PrimerHeader.Item>
        </>
      )}
    </PrimerHeader>
  );
}
