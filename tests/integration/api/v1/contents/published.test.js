// Função a ser testada
function populatePublishedAtValue(oldContent, newContent) {
  if (oldContent && oldContent.published_at) {
    newContent.published_at = oldContent.published_at;
    return;
  }

  if (oldContent && !oldContent.published_at && newContent.status === 'published') {
    newContent.published_at = new Date();
    return;
  }

  if (!oldContent && newContent.status === 'published') {
    newContent.published_at = new Date();
    return;
  }
}

describe('Test Cases for populatePublishedAtValue', () => {
  test('CT1: Teste 1: CD1V, CD2F', () => {
    const oldContent = { published_at: null };
    const newContent = { status: 'draft' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toBeUndefined();
  });

  test('CT2: Teste 2: CD1V, CD2V', () => {
    const oldContent = { published_at: new Date('2023-01-01T00:00:00Z') };
    const newContent = { status: 'draft' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toEqual(oldContent.published_at);
  });

  test('CT3: Teste 3: CD3V, CD4V, CD5V', () => {
    const oldContent = { published_at: null };
    const newContent = { status: 'published' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toBeInstanceOf(Date);
  });

  test('CT4: Teste 4: CD3V, CD4V, CD5F', () => {
    const oldContent = { published_at: null };
    const newContent = { status: 'draft' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toBeUndefined();
  });

  test('CT5: Teste 5: CD3V, CD4F, CD5V', () => {
    const oldContent = { published_at: new Date('2023-01-01T00:00:00Z') };
    const newContent = { status: 'published' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toEqual(oldContent.published_at);
  });

  test('CT6: Teste 6: CD3V, CD4F, CD5F', () => {
    const oldContent = { published_at: new Date('2023-01-01T00:00:00Z') };
    const newContent = { status: 'draft' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toEqual(oldContent.published_at);
  });

  test('CT7: Teste 7: CD6V, CD7V', () => {
    const oldContent = null;
    const newContent = { status: 'published' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toBeInstanceOf(Date);
  });

  test('CT8: Teste 8: CD6V, CD7F', () => {
    const oldContent = null;
    const newContent = { status: 'draft' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toBeUndefined();
  });

  test('CT9: Teste 9: CD6F, CD7V', () => {
    const oldContent = { published_at: new Date('2023-01-01T00:00:00Z') };
    const newContent = { status: 'published' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toEqual(oldContent.published_at);
  });

  test('CT10: Teste 10: CD6F, CD7F', () => {
    const oldContent = { published_at: new Date('2023-01-01T00:00:00Z') };
    const newContent = { status: 'draft' };
    populatePublishedAtValue(oldContent, newContent);
    expect(newContent.published_at).toEqual(oldContent.published_at);
  });
});
