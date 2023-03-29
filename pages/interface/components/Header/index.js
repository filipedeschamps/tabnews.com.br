import { Header, Box, ActionMenu, ActionList, Truncate, Text, Tooltip, Button } from '@primer/react';
import { SquareFillIcon, ThreeBarsIcon, PersonIcon } from '@primer/octicons-react';
import { CgTab } from 'react-icons/cg';
import { HeaderLink, Link, NavItem, useUser } from 'pages/interface';
import { useRouter } from 'next/router';

export default function HeaderComponent() {
  const { user, isLoading, logout } = useUser();

  const { pathname } = useRouter();

  const activeLinkStyle = {
    textDecoration: 'underline',
    textUnderlineOffset: 6,
  };

  const centerTagIconMobile = {
    sx: {
      position: ['absolute', 'static'],
      left: ['50%', '0px'],
      transform: ['translateX(-50%)', 'translateX(-10px)'],
      mx: 2,
    }
  }

  return (
    <Header
      id="header"
      sx={{
        px: [2, null, null, 3],
      }}>
      <Header.Item sx={{ display: ['flex', 'none'] }} full>
        <ActionMenu>
          <ActionMenu.Anchor>
            <Button
              variant="invisible"
              aria-haspopup="true"
              style={{ background: 'transparent' }}
              sx={{ color: 'fg.onEmphasis', px: 0, border: 'none' }}>
              <ThreeBarsIcon size={24} />
            </Button>
          </ActionMenu.Anchor>
          <ActionMenu.Overlay>
            <ActionList>
              {user && (
                <>
                  <NavItem href={`/${user.username}`}>
                    <ActionList.LeadingVisual>
                      <PersonIcon size={16} />
                    </ActionList.LeadingVisual>
                    <Truncate>{user.username}</Truncate>
                  </NavItem>
                  <ActionList.Divider />
                </>
              )}
              <NavItem href="/">Relevantes</NavItem>
              <NavItem href="/recentes">Recentes</NavItem>
              {user && (
                <>
                  <ActionList.Divider />
                  <ActionList.LinkItem as={Link} href="/publicar">
                    Publicar novo conteúdo
                  </ActionList.LinkItem>
                  <ActionList.LinkItem as={Link} href={`/${user.username}`} area-current="false" >
                    Meus conteúdos
                  </ActionList.LinkItem>
                  <ActionList.LinkItem as={Link} href="/perfil">
                    Editar perfil
                  </ActionList.LinkItem>
                  <ActionList.Divider />
                  <ActionList.Item variant="danger" onSelect={logout}>
                    Deslogar
                  </ActionList.Item>
                </>
              )}
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Header.Item>

      <Header.Item  {...centerTagIconMobile}>
        <HeaderLink href="/" aria-label="Voltar para a página inicial">
          <CgTab size={32} />
          <Box sx={{ ml: 2, display: ['none', 'flex'] }}>TabNews</Box>
        </HeaderLink>
      </Header.Item>

      <Header.Item sx={{ ml: 2, display: ['none', 'flex'] }}>
        <HeaderLink href="/" sx={pathname === '/' || pathname.startsWith('/pagina') ? activeLinkStyle : undefined}>
          Relevantes
        </HeaderLink>
      </Header.Item>

      <Header.Item sx={{ ml: 2, display: ['none', 'flex'] }}>
        <HeaderLink href="/recentes" sx={pathname.startsWith('/recentes') ? activeLinkStyle : undefined}>
          Recentes
        </HeaderLink>
      </Header.Item>
      <Header.Item full />
      {
        !isLoading && !user && (
          <>
            <Header.Item sx={{ display: ['none', 'flex'] }}>
              <HeaderLink href="/login">Login</HeaderLink>
            </Header.Item>
            <Header.Item sx={{ display: ['none', 'flex'] }}>
              <HeaderLink href="/cadastro">Cadastrar</HeaderLink>
            </Header.Item>
            <Header.Item sx={{ display: ['flex', 'none'], mr: 0 }}>
              <HeaderLink href="/login">Entrar</HeaderLink>
            </Header.Item>
          </>
        )
      }

      {
        user && (
          <>
            <Header.Item
              sx={{
                mr: 2,
                fontSize: 0,
                fontWeight: 'bold',
              }}>
              <Tooltip aria-label="TabCoins" direction="s" noDelay={true} wrap={true}>
                <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, color: 'accent.emphasis' }}>
                  <SquareFillIcon size={16} />
                  <Text sx={{ color: 'fg.onEmphasis' }}>{user.tabcoins?.toLocaleString('pt-BR')}</Text>
                </Box>
              </Tooltip>
            </Header.Item>

            <Header.Item
              sx={{
                mr: [0, 2],
                fontSize: 0,
                fontWeight: 'bold',
              }}>
              <Tooltip aria-label="TabCash" direction="s" noDelay={true} wrap={true}>
                <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, color: 'success.emphasis' }}>
                  <SquareFillIcon size={16} />
                  <Text sx={{ color: 'fg.onEmphasis' }}>{user.tabcash?.toLocaleString('pt-BR')}</Text>
                </Box>
              </Tooltip>
            </Header.Item>

            <Header.Item sx={{ mr: 0, display: ['none', 'flex'] }}>
              <ActionMenu>
                <ActionMenu.Anchor>
                  <Button
                    variant="invisible"
                    aria-haspopup="true"
                    style={{ background: 'transparent' }}
                    sx={{ color: 'fg.onEmphasis', px: 0, border: 'none' }}>
                    <ThreeBarsIcon size={24} />
                  </Button>
                </ActionMenu.Anchor>

                <ActionMenu.Overlay>
                  <ActionList>
                    <ActionList.LinkItem as={Link} href={`/${user.username}`}>
                      <ActionList.LeadingVisual>
                        <PersonIcon size={16} />
                      </ActionList.LeadingVisual>
                      <Truncate>{user.username}</Truncate>
                    </ActionList.LinkItem>
                    <ActionList.Divider />
                    <NavItem href="/publicar">Publicar novo conteúdo</NavItem>
                    <NavItem href={`/${user.username}`}>Meus conteúdos</NavItem>
                    <NavItem href="/perfil">Editar perfil</NavItem>
                    <ActionList.Divider />
                    <ActionList.Item variant="danger" onSelect={logout}>
                      Deslogar
                    </ActionList.Item>
                  </ActionList>
                </ActionMenu.Overlay>
              </ActionMenu>
            </Header.Item>
          </>
        )
      }
    </Header >
  );
}
