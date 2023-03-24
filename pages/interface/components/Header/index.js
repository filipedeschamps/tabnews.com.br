import { Header, Box, ActionMenu, ActionList, IconButton, Truncate, Text, Tooltip } from '@primer/react';
import { PersonFillIcon, HomeIcon, SquareFillIcon } from '@primer/octicons-react';
import { CgTab } from 'react-icons/cg';
import { HeaderLink, Link, useUser } from 'pages/interface';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function HeaderComponent() {
  const { user, isLoading, logout } = useUser();
  const { asPath } = useRouter();
  const [headerTopPos, setheaderTopPos] = useState(0);
  const [useHeaderTransition, setUseHeaderTransition] = useState(false);

  const activeLinkStyle = {
    textDecoration: 'underline',
    textUnderlineOffset: 6,
  };

  useEffect(() => {
    const headerBoundaries = document.getElementById('header').getBoundingClientRect();
    var previousScroll = 0;

    const handleScroll = () => {
      setUseHeaderTransition(false);
      const scrollDown = window.scrollY - previousScroll > 0;
      setheaderTopPos((h) => Math.min(0, Math.max(-headerBoundaries.height, h + (previousScroll - window.scrollY))));
      previousScroll = window.scrollY;

      const scrollThreshold = 5;
      let scrollTimeout;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setUseHeaderTransition(true);
        setheaderTopPos((h) =>
          scrollDown
            ? h < -scrollThreshold
              ? -headerBoundaries.height
              : 0
            : h > -headerBoundaries.height + scrollThreshold
            ? 0
            : -headerBoundaries.height
        );
      }, 300);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Header
      id="header"
      sx={{
        px: [2, null, null, 3],
        position: 'sticky',
        top: `${headerTopPos}px`,
        transition: useHeaderTransition ? 'top 0.3s ease-in-out' : 'none',
      }}>
      <Header.Item>
        <HeaderLink href="/" aria-label="Voltar para a página inicial">
          <CgTab size={32} />
          <Box sx={{ ml: 2, display: ['none', 'block'] }}>TabNews</Box>
        </HeaderLink>
      </Header.Item>

      <Header.Item>
        <HeaderLink href="/" sx={asPath === '/' || asPath.startsWith('/pagina') ? activeLinkStyle : undefined}>
          Relevantes
        </HeaderLink>
      </Header.Item>

      <Header.Item full>
        <HeaderLink href="/recentes" sx={asPath.startsWith('/recentes') ? activeLinkStyle : undefined}>
          Recentes
        </HeaderLink>
      </Header.Item>

      {!isLoading && !user && (
        <>
          <Header.Item>
            <HeaderLink href={{ pathname: '/login', query: { redirect: asPath } }}>Login</HeaderLink>
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
                  <ActionList.LinkItem as={Link} href={`/${user.username}`}>
                    Meus conteúdos
                  </ActionList.LinkItem>
                  <ActionList.LinkItem as={Link} href="/perfil">
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
