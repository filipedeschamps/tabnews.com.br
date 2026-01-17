import { cardNumber, cvv, holderName, month, year } from './card';

describe('forms', () => {
  describe('cardNumber field', () => {
    it('should have the correct shape', () => {
      expect(cardNumber).toStrictEqual({
        value: '',
        label: 'Número do cartão',
        placeholder: '0000 0000 0000 0000',
        inputMode: 'numeric',
        autoComplete: 'cc-number',
        format: expect.any(Function),
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    it('should format the card number correctly', () => {
      expect(cardNumber.format('1234567890123456789')).toBe('1234 5678 9012 3456 789');
    });

    it('should prepare the card number correctly', () => {
      const prepared = cardNumber.prepare('1234 5678 9012 3456 789');
      expect(prepared).toBe('1234567890123456789');
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return null for valid input length', () => {
        expect(cardNumber.validateOnBlurAndSubmit('1234567890123')).toBeNull();
        expect(cardNumber.validateOnBlurAndSubmit('1234567890123456789')).toBeNull();
      });

      it('should return error message for invalid input length', () => {
        expect(cardNumber.validateOnBlurAndSubmit('')).toBe('Cartão inválido.');
        expect(cardNumber.validateOnBlurAndSubmit('123456789012')).toBe('Cartão inválido.');
        expect(cardNumber.validateOnBlurAndSubmit('12345678901234567890')).toBe('Cartão inválido.');
      });
    });
  });

  describe('holderName field', () => {
    it('should have the correct shape', () => {
      expect(holderName).toStrictEqual({
        value: '',
        label: 'Nome do titular',
        placeholder: 'Informe o nome impresso no cartão',
        autoComplete: 'cc-name',
        format: expect.any(Function),
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    it('should format name to uppercase', () => {
      expect(holderName.format('john doe')).toBe('JOHN DOE');
    });

    it('should prepare name by trimming and converting to uppercase', () => {
      expect(holderName.prepare('  john doe  ')).toBe('JOHN DOE');
    });

    it('should validate name length correctly', () => {
      expect(holderName.validateOnBlurAndSubmit('J')).toBe('Nome do titular precisa ter entre 2 e 50 caracteres.');
      expect(holderName.validateOnBlurAndSubmit('John')).toBeNull();
      expect(holderName.validateOnBlurAndSubmit('J'.repeat(51))).toBe(
        'Nome do titular precisa ter entre 2 e 50 caracteres.',
      );
    });
  });

  describe('month field', () => {
    it('should have the correct shape', () => {
      expect(month).toStrictEqual({
        value: '',
        label: 'Mês',
        autoComplete: 'cc-exp-month',
        validateOnBlurAndSubmit: expect.any(Function),
        onValidChange: expect.any(Function),
        options: expect.any(Array),
      });
    });

    it('should have the correct options', () => {
      expect(month.options).toStrictEqual([
        { value: '', label: 'MM', disabled: true },
        { value: '01', label: '01' },
        { value: '02', label: '02' },
        { value: '03', label: '03' },
        { value: '04', label: '04' },
        { value: '05', label: '05' },
        { value: '06', label: '06' },
        { value: '07', label: '07' },
        { value: '08', label: '08' },
        { value: '09', label: '09' },
        { value: '10', label: '10' },
        { value: '11', label: '11' },
        { value: '12', label: '12' },
      ]);
    });

    describe('onValidChange', () => {
      it('should call updateFields with isValid true if month is not empty', () => {
        const updateFields = vi.fn();
        month.onValidChange({ month: '01', updateFields });
        expect(updateFields).toHaveBeenCalledWith({ month: { isValid: true } });
      });

      it('should call updateFields with isValid false if month is empty', () => {
        const updateFields = vi.fn();
        month.onValidChange({ month: '', updateFields });
        expect(updateFields).toHaveBeenCalledWith({ month: { isValid: false } });
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return "Selecione." if month is empty', () => {
        expect(month.validateOnBlurAndSubmit('')).toBe('Selecione.');
      });

      it('should return null if month is not empty', () => {
        expect(month.validateOnBlurAndSubmit('01')).toBeNull();
      });
    });
  });

  describe('year field', () => {
    it('should have the correct shape', () => {
      expect(year).toStrictEqual({
        value: '',
        label: 'Ano',
        autoComplete: 'cc-exp-year',
        validateOnBlurAndSubmit: expect.any(Function),
        onValidChange: expect.any(Function),
        options: expect.any(Array),
      });
    });

    it('should contain correct options', () => {
      const currentYear = (new Date().getFullYear() % 100).toString().padStart(2, '0');
      const lastYear = ((currentYear + 34) % 100).toString().padStart(2, '0');

      expect(year.options).toStrictEqual(
        expect.arrayContaining([
          { value: '', label: 'AA', disabled: true },
          { value: currentYear, label: currentYear },
          { value: lastYear, label: lastYear },
        ]),
      );
    });

    describe('onValidChange', () => {
      it('should call updateFields with isValid true if year is not empty', () => {
        const updateFields = vi.fn();
        year.onValidChange({ year: '99', updateFields });
        expect(updateFields).toHaveBeenCalledWith({ year: { isValid: true } });
      });

      it('should call updateFields with isValid false if year is empty', () => {
        const updateFields = vi.fn();
        year.onValidChange({ year: '', updateFields });
        expect(updateFields).toHaveBeenCalledWith({ year: { isValid: false } });
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return "Selecione." if year is empty', () => {
        expect(year.validateOnBlurAndSubmit('')).toBe('Selecione.');
      });

      it('should return null if year is not empty', () => {
        expect(year.validateOnBlurAndSubmit('00')).toBeNull();
      });
    });
  });

  describe('cvv field', () => {
    it('should have the correct shape', () => {
      expect(cvv).toStrictEqual({
        value: '',
        label: 'CVV',
        placeholder: '000',
        inputMode: 'numeric',
        autoComplete: 'off',
        format: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    it('should format cvv correctly', () => {
      expect(cvv.format('123')).toBe('123');
      expect(cvv.format('1234')).toBe('1234');
      expect(cvv.format('12345')).toBe('1234');
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return null if cvv is valid', () => {
        expect(cvv.validateOnBlurAndSubmit('123')).toBeNull();
        expect(cvv.validateOnBlurAndSubmit('1234')).toBeNull();
      });

      it('should return error message if cvv is invalid', () => {
        expect(cvv.validateOnBlurAndSubmit('12')).toBe('CVV inválido.');
        expect(cvv.validateOnBlurAndSubmit('12345')).toBe('CVV inválido.');
      });
    });
  });
});
