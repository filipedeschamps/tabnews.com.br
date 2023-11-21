import { useRouter } from 'next/router';

import {
  ActionList,
  ActionMenu,
  Box,
  Confetti,
  HeaderLink,
  IconButton,
  Link,
  PrimerHeader,
  SearchBox,
  Text,
  ThemeSelector,
  ThemeSwitcher,
  Tooltip,
  Truncate,
} from '@/TabNewsUI';
import { CgTab, HomeIcon, PersonFillIcon, PlusIcon, SquareFillIcon } from '@/TabNewsUI/icons';
import { useUser } from 'pages/interface';

export default function HeaderComponent() {
  const { user, isLoading, logout } = useUser();
  const { asPath } = useRouter();

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
        px: [2, null, null, 3],
      }}>
      {Date.now() < 1700708400000 && (asPath === '/' || asPath.includes('parabens-tabnews')) && (
        <Confetti tweenDuration={45000} />
      )}
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

      <PrimerHeader.Item sx={{ mr: 1 }}>
        <SearchBox />
      </PrimerHeader.Item>

      {!isLoading && !user && (
        <>
          <PrimerHeader.Item sx={{ mr: 2 }}>
            <ThemeSwitcher />
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['none', 'flex'] }}>
            <HeaderLink href={loginUrl}>Login</HeaderLink>
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['none', 'flex'] }}>
            <HeaderLink href="/cadastro">Cadastrar</HeaderLink>
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['flex', 'none'] }}>
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
            <Tooltip aria-label="TabCoins" direction="s" noDelay={true} wrap={true}>
              <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, color: '#0969da' }}>
                <SquareFillIcon size={16} />
                <Text sx={{ color: 'fg.onEmphasis' }}>{user.tabcoins?.toLocaleString('pt-BR')}</Text>
              </Box>
            </Tooltip>
          </PrimerHeader.Item>

          <PrimerHeader.Item
            sx={{
              mr: 2,
              fontSize: 0,
              fontWeight: 'bold',
            }}>
            <Tooltip aria-label="TabCash" direction="s" noDelay={true} wrap={true}>
              <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, color: '#2da44e' }}>
                <SquareFillIcon size={16} />
                <Text sx={{ color: 'fg.onEmphasis' }}>{user.tabcash?.toLocaleString('pt-BR')}</Text>
              </Box>
            </Tooltip>
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
