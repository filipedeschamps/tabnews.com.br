import { useRouter } from 'next/router';
import { Header, Box, Button, ActionMenu, ActionList } from '@primer/react';
import { CgTab } from 'react-icons/cg';
import { useUser } from 'pages/interface/index.js';

export default function HeaderComponent() {
  const router = useRouter();
  const { user, isLoading, loginStatus } = useUser();

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

      {loginStatus === 'logged-out' && (
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

      {loginStatus === 'logged-in' && (
        <>
          <Header.Item>
            <ActionMenu>
              <ActionMenu.Button>{user.username}</ActionMenu.Button>

              <ActionMenu.Overlay>
                <ActionList>
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
                  <ActionList.Item variant="danger" onSelect={(event) => alert('Recurso ainda não implementado.')}>
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
