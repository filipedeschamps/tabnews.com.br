import { Header, Box, ActionMenu, ActionList, IconButton, Truncate, Text, Tooltip } from '@primer/react';
import { PersonFillIcon, HomeIcon, SquareFillIcon } from '@primer/octicons-react';
import { CgTab } from 'react-icons/cg';
import { useUser } from 'pages/interface/index.js';
import { HeaderLink, Link } from 'pages/interface/components/Link';
import { useRouter } from 'next/router';

export default function HeaderComponent() {
  const { user, isLoading, logout } = useUser();
  const { pathname } = useRouter();

  const activeLinkStyle = {
    textDecoration: 'underline',
    textUnderlineOffset: 6,
  };

  return (
    <Header
      sx={{
        px: [2, null, null, 3],
      }}>
      <Header.Item>
        <HeaderLink href="/">
          <CgTab size={32} />
          <Box sx={{ ml: 2, display: ['none', 'block'] }}>TabNews</Box>
        </HeaderLink>
      </Header.Item>

      <Header.Item>
        <HeaderLink href="/" sx={(pathname === '/' || pathname.startsWith('/pagina')) && activeLinkStyle}>
          Relevantes
        </HeaderLink>
      </Header.Item>

      <Header.Item full>
        <HeaderLink href="/recentes" sx={pathname.startsWith('/recentes') && activeLinkStyle}>
          Recentes
        </HeaderLink>
      </Header.Item>

      {!isLoading && !user && (
        <>
          <Header.Item>
            <HeaderLink href="/login">Login</HeaderLink>
          </Header.Item>
          <Header.Item>
            <HeaderLink href="/cadastro">Cadastrar</HeaderLink>
          </Header.Item>
        </>
      )}

      {user && (
        <>
          <Header.Item sx={{ mr: 2 }}>
            <Box
              sx={{
                fontSize: 0,
                alignItems: 'center',
                display: 'inline-flex',
                fontWeight: 'bold',
              }}>
              <Box sx={{ color: 'accent.emphasis', display: 'inline-flex' }}>
                <SquareFillIcon size={16} />
              </Box>
              <Tooltip aria-label="TabCoins" direction="s" noDelay={true} wrap={true}>
                <Text sx={{ color: 'fg.onEmphasis' }}>{user.tabcoins?.toLocaleString('pt-BR')}</Text>
              </Tooltip>
            </Box>
          </Header.Item>

          <Header.Item>
            <Box
              sx={{
                fontSize: 0,
                alignItems: 'center',
                display: 'inline-flex',
                fontWeight: 'bold',
              }}>
              <Box sx={{ color: 'success.emphasis', display: 'inline-flex' }}>
                <SquareFillIcon size={16} />
              </Box>
              <Tooltip aria-label="TabCash" direction="s" noDelay={true} wrap={true}>
                <Text sx={{ color: 'fg.onEmphasis' }}>{user.tabcash?.toLocaleString('pt-BR')}</Text>
              </Tooltip>
            </Box>
          </Header.Item>

          <Header.Item sx={{ mr: 0 }}>
            <ActionMenu>
              <ActionMenu.Anchor>
                <IconButton icon={PersonFillIcon} size="small" aria-label="Abrir opções do Perfil" />
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
                  <ActionList.LinkItem
                    href="/perfil"
                    onClick={(event) => {
                      event.preventDefault();
                      alert('Recurso ainda não implementado.');
                    }}>
                    Editar perfil
                  </ActionList.LinkItem>
                  <ActionList.Divider />
                  <ActionList.Item variant="danger" onSelect={logout}>
                    Deslogar
                  </ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
          </Header.Item>
        </>
      )}
    </Header>
  );
}
