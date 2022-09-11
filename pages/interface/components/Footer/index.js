import { Box } from '@primer/react';
import { Link } from 'pages/interface';
import { CgTab } from 'react-icons/cg';

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
          <Link href="/" sx={{ color: 'fg.subtle' }}>
            <CgTab size={26} />
          </Link>
          © {new Date().getFullYear()} TabNews
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: [2, 3, 4, 5],
            paddingX: [2, null, null, 5],
            flexWrap: 'wrap',
          }}>
          <Link href="https://www.tabnews.com.br/filipedeschamps/quem-deseja-acesso-ao-repositorio-privado-do-tabnews">
            Contribuir
          </Link>
          <Link href="/museu">Museu</Link>
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
