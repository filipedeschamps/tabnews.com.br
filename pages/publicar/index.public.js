import { DefaultLayout, Content } from 'pages/interface/index.js';
import {
  PageLayout,
  FormControl,
  Box,
  Heading,
  Button,
  TextInput,
  Flash,
  Text,
  StateLabel,
  Link,
  BranchName,
  TabNav,
  Textarea,
} from '@primer/react';

export default function Post() {
  return (
    <DefaultLayout metadata={{ title: 'Publicar novo conteúdo' }}>
      <Heading as="h1" sx={{ mb: 3 }}>
        Publicar novo conteúdo
      </Heading>
      <Content mode="edit" />
    </DefaultLayout>
  );
}
