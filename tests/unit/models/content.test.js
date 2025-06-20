import { Content } from '../../../models/urls'; // Ajuste o caminho conforme necessário

describe('Content Model', () => {
  describe('isValidSourceURL', () => {
    it('CT1: source_url é nulo', () => {
      expect(Content.isValidSourceURL(null)).toBe(true);
    });

    it('CT2: source_url é HTTP válido', () => {
      expect(Content.isValidSourceURL('http://valid.com')).toBe(true);
    });

    it('CT3: source_url com protocolo inválido', () => {
      expect(Content.isValidSourceURL('ftp://invalid.com')).toBe(false);
    });

    it('CT4: source_url com hostname vazio', () => {
      expect(Content.isValidSourceURL('http://')).toBe(false);
    });

    it('CT5: source_url é inválida', () => {
      expect(Content.isValidSourceURL('invalido')).toBe(false);
    });
  });
});
