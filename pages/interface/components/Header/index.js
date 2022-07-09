import { Header, Box, ActionMenu, ActionList, IconButton, Truncate, Text, Tooltip } from '@primer/react';
import { PersonFillIcon, HomeIcon, SquareFillIcon } from '@primer/octicons-react';
import { CgTab } from 'react-icons/cg';
import { useUser } from 'pages/interface/index.js';

export default function HeaderComponent() {
  const { user, isLoading, logout } = useUser();

  return (
    <Header>
      <Header.Item>
        <Header.Link href="/" fontSize={2}>
          <CgTab size={32} />
          <Box sx={{ ml: 2 }}>TabNews</Box>
        </Header.Link>
      </Header.Item>

      <Header.Item full>
        <Header.Link href="/status" fontSize={2}>
          Status
        </Header.Link>
      </Header.Item>

      {!isLoading && !user && (
        <>
          <Header.Item>
            <Header.Link href="/login" fontSize={2}>
              Login
            </Header.Link>
          </Header.Item>
          <Header.Item>
            <Header.Link href="/cadastro" fontSize={2}>
              Cadastrar
            </Header.Link>
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
                  <ActionList.LinkItem href={`/${user.username}`}>
                    <ActionList.LeadingVisual>
                      <HomeIcon size={16} />
                    </ActionList.LeadingVisual>
                    <Truncate>{user.username}</Truncate>
                  </ActionList.LinkItem>
                  <ActionList.Divider />
                  <ActionList.LinkItem href="/publicar">Publicar novo conteúdo</ActionList.LinkItem>
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
