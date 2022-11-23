import { Header, Box, ActionMenu, ActionList, IconButton, Truncate, Text, Tooltip, useTheme } from '@primer/react';
import { PersonFillIcon, HomeIcon, SquareFillIcon } from '@primer/octicons-react';
import { CgTab } from 'react-icons/cg';
import { HeaderLink, Link, useUser } from 'pages/interface';
import { useRouter } from 'next/router';
import React from 'react';

export default function HeaderComponent(props) {
  const { user, isLoading, logout } = useUser();
  const { pathname } = useRouter();
  const [colorMode, setColorMode] = React.useState('light');

  const activeLinkStyle = {
    textDecoration: 'underline',
    textUnderlineOffset: 6,
  };

  const handlerColorMode = () => {
    const newTheme = colorMode === 'light' ? 'dark' : 'light';
    localStorage.setItem('themeStore', newTheme);
    document.getElementsByTagName('html')[0].setAttribute('theme', newTheme);
    setColorMode(newTheme);
  };

  React.useEffect(() => {
    const theme = localStorage.getItem('themeStore');
    if (theme) {
      setColorMode(theme);
    }
  }, []);

  return (
    <Header
      sx={{
        ...props.sx,
        px: [2, null, null, 3],
      }}>
      <Header.Item>
        <HeaderLink href="/">
          <CgTab size={32} />
          <Box sx={{ ml: 2, display: ['none', 'block'] }}>TabNews</Box>
        </HeaderLink>
      </Header.Item>

      <Header.Item>
        <HeaderLink href="/" sx={pathname === '/' || pathname.startsWith('/pagina') ? activeLinkStyle : undefined}>
          Relevantes
        </HeaderLink>
      </Header.Item>

      <Header.Item full>
        <HeaderLink href="/recentes" sx={pathname.startsWith('/recentes') ? activeLinkStyle : undefined}>
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
              mr: 2,
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
                  <ActionList.LinkItem as={Link} href="/perfil">
                    Editar perfil
                  </ActionList.LinkItem>
                  <ActionList.Item onClick={handlerColorMode}>
                    Alterar tema ({colorMode === 'light' ? 'Dark' : 'Light'})
                  </ActionList.Item>
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
