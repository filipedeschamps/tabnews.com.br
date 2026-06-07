import { clsx } from 'clsx';
import { useRouter } from 'next/router';
import { useState } from 'react';

import {
  ActionList,
  ActionMenu,
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
import { useMediaQuery, useUser } from 'interface';

import classes from './index.module.css';

export default function HeaderComponent() {
  const isScreenSmall = useMediaQuery('(max-width: 440px)');
  const { user, isLoading, logout } = useUser();
  const { asPath, pathname } = useRouter();
  const { SearchBarButton, SearchBarMenuItem, SearchBoxOverlay, SearchIconButton } = useSearchBox();
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  const loginUrl =
    !asPath || user || pathname.startsWith('/cadastro')
      ? '/login'
      : pathname.startsWith('/login')
        ? asPath
        : `/login?redirect=${asPath}`;

  const canListUsers = user?.features.includes('read:user:list');

  return (
    <PrimerHeader as="header" id="header" className={classes.Wrapper}>
      <SearchBoxOverlay />
      <nav className={classes.Nav}>
        <PrimerHeader.Item className={classes.ItemFlush}>
          <HeaderLink href="/" aria-label="Página inicial Relevantes" aria-current={asPath === '/' ? 'page' : false}>
            <CgTab size={32} />

            <div className={classes.Brand}>TabNews</div>

            <div className={asPath === '/' || asPath.startsWith('/pagina') ? classes.ActiveLink : classes.NavLink}>
              Relevantes
            </div>
          </HeaderLink>
        </PrimerHeader.Item>

        <PrimerHeader.Item full className={classes.ItemFlush}>
          <HeaderLink
            href="/recentes/pagina/1"
            aria-current={asPath === '/recentes/pagina/1' ? 'page' : false}
            className={asPath.startsWith('/recentes') ? classes.ActiveLink : classes.NavLink}>
            Recentes
          </HeaderLink>
        </PrimerHeader.Item>
      </nav>

      {!isLoading && !(isScreenSmall && user) && (
        <PrimerHeader.Item className={classes.SearchItem}>
          <SearchBarButton />
          <SearchIconButton />
        </PrimerHeader.Item>
      )}

      {!isLoading && !user && (
        <>
          <PrimerHeader.Item className={classes.ItemMr1}>
            <ThemeSwitcher />
          </PrimerHeader.Item>

          {!isScreenSmall && (
            <>
              <PrimerHeader.Item className={classes.ItemMl2}>
                <HeaderLink href={loginUrl}>Login</HeaderLink>
              </PrimerHeader.Item>
              <PrimerHeader.Item className={classes.ItemMr1}>
                <HeaderLink href="/cadastro">Cadastrar</HeaderLink>
              </PrimerHeader.Item>
            </>
          )}

          {isScreenSmall && (
            <PrimerHeader.Item className={clsx(classes.ItemMl2, classes.ItemMr1)}>
              <HeaderLink href={loginUrl}>Entrar</HeaderLink>
            </PrimerHeader.Item>
          )}
        </>
      )}

      {user && (
        <>
          {!isScreenSmall && (
            <PrimerHeader.Item className={classes.ItemM2}>
              <Tooltip text="Publicar novo conteúdo" direction="s">
                <HeaderLink href="/publicar">
                  <PlusIcon />
                </HeaderLink>
              </Tooltip>
            </PrimerHeader.Item>
          )}

          <PrimerHeader.Item className={classes.TabCoin}>
            <TabCoinCount amount={user.tabcoins} className={classes.TabCoinCount} />
          </PrimerHeader.Item>

          <PrimerHeader.Item className={classes.TabCash}>
            <TabCashCount amount={user.tabcash} className={classes.TabCashCount} />
          </PrimerHeader.Item>

          <PrimerHeader.Item className={classes.ItemFlush}>
            <ActionMenu open={isOpenMenu} onOpenChange={setIsOpenMenu}>
              <ActionMenu.Anchor>
                <Button
                  aria-label="Abrir o menu"
                  variant="invisible"
                  className={classes.MenuButton}
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

                  <ThemeSelector
                    onSelect={() => setIsOpenMenu(false)}
                    as="li"
                    role="none"
                    className={classes.ThemeSelector}
                  />
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
