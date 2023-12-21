import { useRouter } from 'next/router';

import {
  ActionList,
  ActionMenu,
  Box,
  Button,
  HeaderLink,
  NavItem,
  NavList,
  PrimerHeader,
  TabCashCount,
  TabCoinCount,
  ThemeSelector,
  ThemeSwitcher,
  Tooltip,
  Truncate,
  useSearchBox,
} from '@/TabNewsUI';
import {
  CgTab,
  GearIcon,
  ListUnorderedIcon,
  PersonIcon,
  PlusIcon,
  SignOutIcon,
  ThreeBarsIcon,
} from '@/TabNewsUI/icons';
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

      <PrimerHeader.Item full sx={{ mr: 0 }}>
        <HeaderLink href="/recentes" sx={asPath.startsWith('/recentes') ? activeLinkStyle : undefined}>
          Recentes
        </HeaderLink>
      </PrimerHeader.Item>

      {!isLoading && (
        <PrimerHeader.Item
          sx={{
            display: user ? ['none', 'flex'] : 'flex',
            ml: 3,
            mr: [1, , 3],
          }}>
          <SearchBarButton />
          <SearchIconButton />
        </PrimerHeader.Item>
      )}

      {!isLoading && !user && (
        <>
          <PrimerHeader.Item sx={{ mr: 1 }}>
            <ThemeSwitcher />
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['none', 'flex'], ml: 2 }}>
            <HeaderLink href={loginUrl}>Login</HeaderLink>
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['none', 'flex'], mr: 1 }}>
            <HeaderLink href="/cadastro">Cadastrar</HeaderLink>
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['flex', 'none'], ml: 2, mr: 1 }}>
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
                <PlusIcon />
              </HeaderLink>
            </Tooltip>
          </PrimerHeader.Item>

          <PrimerHeader.Item
            sx={{
              mr: [0, 2],
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
                <Button
                  aria-label="Abrir o menu"
                  variant="invisible"
                  sx={{
                    px: 0,
                    mx: 1,
                    color: 'header.logo',
                    '&:hover': {
                      color: 'header.text',
                      backgroundColor: 'transparent',
                    },
                    '&:focus-visible': { outline: '2px solid #FFF' },
                  }}
                  style={{ background: 'transparent' }}>
                  <ThreeBarsIcon size={24} />
                </Button>
              </ActionMenu.Anchor>

              <ActionMenu.Overlay>
                <NavList>
                  <NavItem href={`/${user.username}`}>
                    <NavList.LeadingVisual>
                      <PersonIcon />
                    </NavList.LeadingVisual>
                    <Truncate>{user.username}</Truncate>
                  </NavItem>

                  <NavList.Group>
                    <NavItem href="/publicar">
                      <NavList.LeadingVisual>
                        <PlusIcon />
                      </NavList.LeadingVisual>
                      Novo conteúdo
                    </NavItem>

                    <NavItem href={`/${user.username}/conteudos/1`}>
                      <NavList.LeadingVisual>
                        <ListUnorderedIcon />
                      </NavList.LeadingVisual>
                      Meus conteúdos
                    </NavItem>

                    <NavItem href="/perfil">
                      <NavList.LeadingVisual>
                        <GearIcon />
                      </NavList.LeadingVisual>
                      Editar perfil
                    </NavItem>
                    <NavList.Divider />
                  </NavList.Group>

                  <ActionList.Item sx={{ display: [, 'none'] }} onSelect={onClickSearchButton}>
                    <SearchBarMenuItem />
                  </ActionList.Item>

                  <ActionList.Item>
                    <ThemeSelector />
                  </ActionList.Item>
                  <ActionList.Divider />

                  <ActionList.Item variant="danger" onSelect={logout}>
                    <ActionList.LeadingVisual>
                      <SignOutIcon />
                    </ActionList.LeadingVisual>
                    Deslogar
                  </ActionList.Item>
                </NavList>
              </ActionMenu.Overlay>
            </ActionMenu>
          </PrimerHeader.Item>
        </>
      )}
    </PrimerHeader>
  );
}
