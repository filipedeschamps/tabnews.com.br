import {
  ActionList,
  ActionMenu,
  Box,
  HeaderLink,
  IconButton,
  Link,
  PrimerHeader,
  Text,
  ThemeSelector,
  ThemeSwitcher,
  Tooltip,
  Truncate,
} from '@/TabNewsUI';
import { HomeIcon, PersonFillIcon, SquareFillIcon } from '@primer/octicons-react';
import { useRouter } from 'next/router';
import { useUser } from 'pages/interface';
import { CgTab } from 'react-icons/cg';

export default function HeaderComponent() {
  const { user, isLoading, logout } = useUser();
  const { asPath } = useRouter();

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

      {!isLoading && !user && (
        <>
          <PrimerHeader.Item sx={{ mr: 2 }}>
            <ThemeSwitcher />
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['none', 'flex'] }}>
            <HeaderLink href={{ pathname: '/login', query: { redirect: asPath } }}>Login</HeaderLink>
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['none', 'flex'] }}>
            <HeaderLink href="/cadastro">Cadastrar</HeaderLink>
          </PrimerHeader.Item>
          <PrimerHeader.Item sx={{ display: ['flex', 'none'] }}>
            <HeaderLink href={{ pathname: '/login', query: { redirect: asPath } }}>Entrar</HeaderLink>
          </PrimerHeader.Item>
        </>
      )}

      {user && (
        <>
          <PrimerHeader.Item
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
          </PrimerHeader.Item>

          <PrimerHeader.Item
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
          </PrimerHeader.Item>

          <PrimerHeader.Item sx={{ mr: 0 }}>
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
