import { validate as isCnpjValid } from 'validation-br/dist/cnpj';
import { validate as isCpfValid } from 'validation-br/dist/cpf';

export const brDocs = {
  value: '',
  label: 'CPF/CNPJ',
  placeholder: 'Informe seu CPF ou CNPJ',
  prepare: (document) => {
    const cpf = document.replace(/\D/g, '').padStart(11, '0');
    if (isCpfValid(cpf)) {
      return {
        type: 'CPF',
        number: cpf,
      };
    }

    const cnpj = document.replace(/[^a-zA-Z0-9]/g, '').padStart(14, '0');
    if (isCnpjValid(cnpj)) {
      return {
        type: 'CNPJ',
        number: cnpj,
      };
    }

    return {
      type: 'PASSPORT',
      number: document.trim(),
    };
  },
  validateOnBlurAndSubmit: (doc) => {
    if (['CPF', 'CNPJ'].includes(doc.type)) {
      return null;
    }

    if (doc.number.length > 50) {
      return 'Passaporte deve ter no máximo 50 caracteres.';
    }

    if (!doc.number.length) {
      return 'Informe um documento válido.';
    }

    return null;
  },
};
