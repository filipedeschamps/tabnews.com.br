import { useRouter } from 'next/router';
import { useState } from 'react';

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
import { useMediaQuery, useUser } from 'pages/interface';

export default function HeaderComponent() {
  const isScreenSmall = useMediaQuery('(max-width: 440px)');
  const { user, isLoading, logout } = useUser();
  const { asPath } = useRouter();
  const { SearchBarButton, SearchBarMenuItem, SearchBoxOverlay, SearchIconButton } = useSearchBox();
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  const loginUrl =
    !asPath || user || asPath.startsWith('/cadastro')
      ? '/login'
      : asPath.startsWith('/login')
        ? asPath
        : `/login?redirect=${asPath}`;

  const activeLinkStyle = {
    textDecoration: 'underline',
    textUnderlineOffset: 6,
    ml: 3,
  };

  const canListUsers = user?.features.includes('read:user:list');

  return (
    <PrimerHeader as="header" id="header" sx={{ minWidth: 'max-content', px: [2, null, null, 3] }}>
      <SearchBoxOverlay />
      <Box as="nav" sx={{ display: 'flex', flex: 1, margin: 0, padding: 0 }}>
        <PrimerHeader.Item sx={{ mr: 0 }}>
          <HeaderLink href="/" aria-label="Página inicial Relevantes" aria-current={asPath === '/' ? 'page' : false}>
            <CgTab size={32} />

            <Box sx={{ ml: 2, display: ['none', 'block'] }}>TabNews</Box>

            <Box sx={asPath === '/' || asPath.startsWith('/pagina') ? activeLinkStyle : { ml: 3 }}>Relevantes</Box>
          </HeaderLink>
        </PrimerHeader.Item>

        <PrimerHeader.Item full sx={{ mr: 0 }}>
          <HeaderLink
            href="/recentes/pagina/1"
            aria-current={asPath === '/recentes/pagina/1' ? 'page' : false}
            sx={asPath.startsWith('/recentes') ? activeLinkStyle : { ml: 3 }}>
            Recentes
          </HeaderLink>
        </PrimerHeader.Item>
      </Box>

      {!isLoading && !(isScreenSmall && user) && (
        <PrimerHeader.Item sx={{ ml: 3, mr: [1, , 3] }}>
          <SearchBarButton />
          <SearchIconButton />
        </PrimerHeader.Item>
      )}

      {!isLoading && !user && (
        <>
          <PrimerHeader.Item sx={{ mr: 1 }}>
            <ThemeSwitcher />
          </PrimerHeader.Item>

          {!isScreenSmall && (
            <>
              <PrimerHeader.Item sx={{ ml: 2 }}>
                <HeaderLink href={loginUrl}>Login</HeaderLink>
              </PrimerHeader.Item>
              <PrimerHeader.Item sx={{ mr: 1 }}>
                <HeaderLink href="/cadastro">Cadastrar</HeaderLink>
              </PrimerHeader.Item>
            </>
          )}

          {isScreenSmall && (
            <PrimerHeader.Item sx={{ ml: 2, mr: 1 }}>
              <HeaderLink href={loginUrl}>Entrar</HeaderLink>
            </PrimerHeader.Item>
          )}
        </>
      )}

      {user && (
        <>
          {!isScreenSmall && (
            <PrimerHeader.Item sx={{ m: 2 }}>
              <Tooltip text="Publicar novo conteúdo" direction="s">
                <HeaderLink href="/publicar">
                  <PlusIcon />
                </HeaderLink>
              </Tooltip>
            </PrimerHeader.Item>
          )}

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
            <ActionMenu open={isOpenMenu} onOpenChange={setIsOpenMenu}>
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

                  {canListUsers && (
                    <NavList.Group>
                      <NavItem href="/moderacao/usuarios/1">
                        <NavList.LeadingVisual>
                          <ListUnorderedIcon />
                        </NavList.LeadingVisual>
                        Usuários
                      </NavItem>
                    </NavList.Group>
                  )}

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

                  {isScreenSmall && (
                    <>
                      <SearchBarMenuItem />
                      <ActionList.Divider />
                    </>
                  )}

                  <ThemeSelector onSelect={() => setIsOpenMenu(false)} as="li" role="none" sx={{ listStyle: 'none' }} />
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
