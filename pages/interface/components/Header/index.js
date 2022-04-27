import { Header, Box, Button, ActionMenu, ActionList } from '@primer/react';
import { CgTab } from 'react-icons/cg';
import { useUser } from 'pages/interface/index.js';

export default function HeaderComponent() {
  const { user, isLoading } = useUser();

  return (
    <Header>
      <Header.Item full>
        <Header.Link href="/" fontSize={2}>
          <CgTab size={16} />
          <Box sx={{ ml: 2 }}>TabNews</Box>
        </Header.Link>
      </Header.Item>
      {!isLoading && !user.username && (
        <>
          <Header.Item>
            <Header.Link href="/login" fontSize={2}>
              Login
            </Header.Link>
          </Header.Item>
          <Header.Item>
            <Header.Link href="/cadastro" fontSize={2}>
              <Button size="small">Cadastrar</Button>
            </Header.Link>
          </Header.Item>
        </>
      )}

      {!isLoading && user.username && (
        <Header.Item>
          <ActionMenu>
            <ActionMenu.Button size="small">{user.username}</ActionMenu.Button>

            <ActionMenu.Overlay>
              <ActionList>
                <ActionList.LinkItem href="/criar">Criar conteúdo</ActionList.LinkItem>
                <ActionList.Divider />
                <ActionList.Item variant="danger" onSelect={(event) => alert('Recurso ainda não implementado.')}>
                  Deslogar
                </ActionList.Item>
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>
        </Header.Item>
      )}
    </Header>
  );
}
