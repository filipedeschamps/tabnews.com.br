import { Header, Box, ActionMenu, ActionList, IconButton, Truncate, Text, Tooltip, Button } from '@primer/react';
import { PersonFillIcon, HomeIcon, SquareFillIcon, ThreeBarsIcon } from '@primer/octicons-react';
import { CgTab } from 'react-icons/cg';
import { HeaderLink, Link, NavItem, useUser } from 'pages/interface';
import { useRouter } from 'next/router';
import { createRef, useState } from 'react';

export default function HeaderComponent() {
  const { user, isLoading, logout } = useUser();
  const [open, setOpen] = useState(false);
  const anchorRef = createRef();

  const { pathname } = useRouter();

  const activeLinkStyle = {
    textDecoration: 'underline',
    textUnderlineOffset: 6,
  };

  return (
    <Header
      id="header"
      sx={{
        px: [2, null, null, 3],
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      <Header.Item sx={{ display: ['flex', 'none'] }} full>
        <Button
          variant="invisible"
          ref={anchorRef}
          aria-haspopup="true"
          aria-expanded={open}
          style={{ background: 'transparent', border: 'none' }}
          sx={{ color: 'fg.onEmphasis' }}
          onClick={() => setOpen(!open)}>
          <ThreeBarsIcon size={24} />
        </Button>
        <ActionMenu open={open} onOpenChange={setOpen} anchorRef={anchorRef}>
          <ActionMenu.Overlay>
            <ActionList>
              <NavItem href="/">Relevantes</NavItem>
              <NavItem href="/recentes">Recentes</NavItem>
              {user && (
                <>
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
                </>
              )}
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Header.Item>

      <Header.Item sx={{ mx: 'auto' }}>
        <HeaderLink href="/" aria-label="Voltar para a página inicial">
          <CgTab size={32} />
          <Box sx={{ ml: 2, display: ['none', 'block'] }}>TabNews</Box>
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

          <Header.Item sx={{ mr: 0, display: ['none', 'flex'] }}>
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
      )}
    </Header>
  );
}
