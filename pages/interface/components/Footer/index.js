import { Box, Link } from '@/TabNewsUI';
import { CgTab } from '@/TabNewsUI/icons';

export default function Footer(props) {
  return (
    <Box as="footer" {...props}>
      <Box
        fontSize={1}
        sx={{
          borderColor: 'border.default',
          borderTopStyle: 'solid',
          borderTopWidth: 1,
          width: '100%',
          paddingX: 2,
          paddingY: [4, null, null, 5],
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap-reverse',
          gap: 3,
        }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            color: 'fg.subtle',
          }}>
          <Link
            sx={{
              color: 'fg.subtle',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            href="/"
            aria-label="Voltar para a página inicial">
            <CgTab size={26} />
          </Link>
          &copy; {new Date().getFullYear()} TabNews
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: [3, null, 4, 5],
            paddingX: [2, null, null, 5],
            flexWrap: 'wrap',
          }}>
          <Link href="/contato">Contato</Link>
          <Link href="https://github.com/filipedeschamps/tabnews.com.br">GitHub</Link>
          <Link href="/museu">Museu</Link>
          <Link href="/recentes/rss">RSS</Link>
          <Link href="https://www.tabnews.com.br/filipedeschamps/tentando-construir-um-pedaco-de-internet-mais-massa">
            Sobre
          </Link>
          <Link href="/status">Status</Link>
          <Link href="/termos-de-uso">Termos de Uso</Link>
        </Box>
      </Box>
    </Box>
  );
}
