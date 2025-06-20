import { describe, expect, it } from 'vitest';

import contentModel from 'models/content.js';

const { populatePublishedAtValue } = contentModel; //--- pra importar a função.

describe('populatePublishedAtValue', () => {
  //Teste para a D1, que não faz parte do MC/DC da D2
  it('[CT1] deve manter a data de publicação se o conteúdo já era publicado', () => {
    //Cenário0: Cobre a Decisão 1 (D1)
    const existingDate = new Date('2025-01-01T12:00:00Z');
    const oldContent = { published_at: existingDate };
    const newContent = { status: 'published' };

    populatePublishedAtValue(oldContent, newContent);

    //Verifica se a data original foi mantida
    expect(newContent.published_at).toBe(existingDate);
  });

  //Início dos testes para cobertura MC/DC da Decisão 2 (D2)

  it('[CT2] deve definir data ao criar um conteúdo já como "published"', () => {
    //enário01: Cobre a Linha 4 da tabela verdade da D2 ---> (F,V,V)
    const oldContent = null;
    const newContent = { status: 'published' };

    populatePublishedAtValue(oldContent, newContent);

    //Verifica se a data foi definida e se é um objeto Date
    expect(newContent.published_at).toBeInstanceOf(Date);
  });

  it('[CT5] deve manter a data ao tentar republicar um conteúdo já publicado', () => {
    //Cenário02: Cobre a Linha 6 da tabela verdade da D2 --> (V,F,V)
    const existingDate = new Date('2025-01-01T12:00:00Z');
    const oldContent = { published_at: existingDate };
    const newContent = { status: 'published' };

    populatePublishedAtValue(oldContent, newContent);

    //A data não deve mudar, mantendo a original
    expect(newContent.published_at).toBe(existingDate);
  });

  it('[CT4] não deve definir data ao salvar um rascunho (draft)', () => {
    //Cenário03: Cobre a Linha 7 da tabela verdade da D2 ---> (V,V,F)
    const oldContent = { published_at: null };
    const newContent = { status: 'draft' };

    populatePublishedAtValue(oldContent, newContent);

    //A data de publicação deve continuar indefinida
    expect(newContent.published_at).toBeUndefined();
  });

  it('[CT3] deve definir data ao publicar um rascunho existente', () => {
    //Cenário04: Cobre a Linha 8 da tabela verdade da D2 ---> (V,V,V)
    const oldContent = { published_at: null };
    const newContent = { status: 'published' };

    populatePublishedAtValue(oldContent, newContent);

    //Verifica se uma nova data foi atribuída
    expect(newContent.published_at).toBeInstanceOf(Date);
  });
});
