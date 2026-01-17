import { state } from '.';

describe('forms', () => {
  describe('state field', () => {
    it('should have the correct shape', () => {
      expect(state).toStrictEqual({
        value: '',
        label: 'Estado',
        autoComplete: 'address-level1',
        validateOnBlurAndSubmit: expect.any(Function),
        onValidChange: expect.any(Function),
        options: expect.any(Array),
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return null if state is provided', () => {
        expect(state.validateOnBlurAndSubmit('SP')).toBeNull();
      });

      it('should return "Selecione" if state is not provided', () => {
        expect(state.validateOnBlurAndSubmit('')).toBe('Selecione');
      });
    });

    describe('onValidChange', () => {
      it('should update state validity to true if value is provided', () => {
        const updateFields = vi.fn();
        state.onValidChange({ value: 'SP', updateFields });
        expect(updateFields).toHaveBeenCalledWith({ state: { isValid: true } });
      });

      it('should update state validity to false if value is not provided', () => {
        const updateFields = vi.fn();
        state.onValidChange({ value: '', updateFields });
        expect(updateFields).toHaveBeenCalledWith({ state: { isValid: false } });
      });
    });

    describe('options', () => {
      it('should have "Selecione" as the first option', () => {
        expect(state.options[0]).toStrictEqual({ value: '', label: 'Selecione', disabled: true });
      });

      it('should have correct number of options', () => {
        expect(state.options.length).toBe(28);
      });

      it('should contain specific state options', () => {
        expect(state.options).toStrictEqual(
          expect.arrayContaining([
            { value: '', label: 'Selecione', disabled: true },
            { value: 'SP', label: 'São Paulo (SP)' },
            { value: 'RJ', label: 'Rio de Janeiro (RJ)' },
            { value: 'MG', label: 'Minas Gerais (MG)' },
          ]),
        );
      });
    });
  });
});
