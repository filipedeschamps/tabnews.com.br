import { Header, Box, ActionMenu, ActionList, IconButton, Truncate, Text, Tooltip } from '@primer/react';
import { PersonFillIcon, HomeIcon, SquareFillIcon } from '@primer/octicons-react';
import { CgTab } from 'react-icons/cg';
import { useUser } from 'pages/interface/index.js';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

function ActionListNextLink({ children, href, ...rest }) {
  return (
    <NextLink href={href} passHref>
      <a {...rest}>{children}</a>
    </NextLink>
  );
}

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
        pl: [2, null, null, 3],
        pr: [2, null, null, 3],
      }}>
      <Header.Item>
        <NextLink href="/" passHref>
          <Header.Link fontSize={2} sx={(pathname === '/' || pathname.startsWith('/pagina')) && activeLinkStyle}>
            <CgTab size={32} />
            <Box sx={{ ml: 2 }}>Relevantes</Box>
          </Header.Link>
        </NextLink>
      </Header.Item>

      <Header.Item>
        <NextLink href="/recentes" passHref>
          <Header.Link fontSize={2} sx={pathname.startsWith('/recentes') && activeLinkStyle}>
            Recentes
          </Header.Link>
        </NextLink>
      </Header.Item>

      <Header.Item full>
        <NextLink href="/status" passHref>
          <Header.Link
            fontSize={2}
            sx={{ display: ['none', 'block'], ...(pathname.startsWith('/status') && activeLinkStyle) }}>
            Status
          </Header.Link>
        </NextLink>
      </Header.Item>

      {!isLoading && !user && (
        <>
          <Header.Item>
            <NextLink href="/login" passHref>
              <Header.Link fontSize={2}>Login</Header.Link>
            </NextLink>
          </Header.Item>
          <Header.Item>
            <NextLink href="/cadastro" passHref>
              <Header.Link fontSize={2}>Cadastrar</Header.Link>
            </NextLink>
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
                  <ActionList.LinkItem as={ActionListNextLink} href={`/${user.username}`}>
                    <ActionList.LeadingVisual>
                      <HomeIcon size={16} />
                    </ActionList.LeadingVisual>
                    <Truncate>{user.username}</Truncate>
                  </ActionList.LinkItem>
                  <ActionList.Divider />
                  <ActionList.LinkItem as={ActionListNextLink} href="/publicar">
                    Publicar novo conteúdo
                  </ActionList.LinkItem>
                  <ActionList.LinkItem
                    as={ActionListNextLink}
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
