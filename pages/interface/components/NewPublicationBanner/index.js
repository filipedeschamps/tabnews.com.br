import { Box, HeaderLink, Text } from '@/TabNewsUI';
import { PlusCircleIcon } from '@/TabNewsUI/icons';

export default function NewPublicationBanner() {
  return (
    <Box
      as="aside"
      sx={{
        display: 'grid',
      }}>
      <HeaderLink href="/publicar" sx={{ gap: 2 }}>
        <PlusCircleIcon size={12} />
        <Text>Publicar novo conteúdo</Text>
        <Text>Você é bem vindo no TabNews, gere valor na comunidade e ganhe tabCoins!</Text>
      </HeaderLink>
    </Box>
  );
}
