import { noop } from 'packages/helpers';

import { cep } from '.';
import { format, getAddress, onValidChange, prepare, validateOnBlurAndSubmit } from './cep';

describe('forms', () => {
  describe('cep field', () => {
    beforeAll(() => {
      vi.spyOn(console, 'warn').mockImplementation(noop);
      vi.spyOn(global, 'fetch').mockResolvedValue();
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('should have the correct shape', () => {
      expect(cep).toStrictEqual({
        label: 'CEP',
        value: '',
        maxLength: 10,
        placeholder: '00000-000',
        inputMode: 'numeric',
        autoComplete: 'postal-code',
        format,
        prepare,
        validateOnBlurAndSubmit,
        onValidChange,
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return error message for incomplete CEP', () => {
        expect(validateOnBlurAndSubmit('12345')).toBe('CEP incompleto');
      });

      it('should return error message for invalid CEP', () => {
        expect(validateOnBlurAndSubmit('123456789')).toBe('CEP inválido');
      });

      it('should return error message for empty CEP', () => {
        expect(validateOnBlurAndSubmit('')).toBe('CEP inválido');
      });

      it('should return null for valid CEP length', () => {
        expect(validateOnBlurAndSubmit('12345678')).toBeNull();
      });
    });

    describe('onValidChange', () => {
      it('should not call updateState for incomplete CEP', async () => {
        const updateState = vi.fn();
        const address = await onValidChange({ value: '12345', updateState });
        expect(updateState).not.toHaveBeenCalled();
        expect(address).toBeUndefined();
      });

      it('should call updateState with loading true for valid CEP', async () => {
        const updateState = vi.fn();
        global.fetch.mockResolvedValueOnce({
          ok: true,
          // eslint-disable-next-line require-await
          json: async () => ({
            cep: '12345678',
            state: 'SP',
            city: 'São Paulo',
            neighborhood: 'Centro',
            street: 'Rua A',
          }),
        });

        await onValidChange({ value: '12345-678', updateState });

        expect(updateState).toHaveBeenCalledWith({ cep: { loading: true } });
      });

      it('should call updateState with address data for valid CEP', async () => {
        const updateState = vi.fn();
        global.fetch.mockResolvedValueOnce({
          ok: true,
          // eslint-disable-next-line require-await
          json: async () => ({
            cep: '12345678',
            state: 'SP',
            city: 'São Paulo',
            neighborhood: 'Centro',
            street: 'Rua A',
          }),
        });

        const expectedAddress = {
          cep: { value: '12345-678', loading: false, error: null, isValid: true },
          state: { value: 'SP', error: null, isValid: true },
          city: { value: 'São Paulo', error: null, isValid: true },
          neighborhood: { value: 'Centro', error: null, isValid: true },
          street: { value: 'Rua A', error: null, isValid: true },
        };

        const address = await onValidChange({ value: '12345-678', updateState });

        expect(updateState).toHaveBeenCalledWith(expectedAddress);
        expect(address).toStrictEqual(expectedAddress);
      });

      it('should call updateState without address data for inexistent CEP', async () => {
        const updateState = vi.fn();
        global.fetch.mockResolvedValueOnce({
          ok: true,
          // eslint-disable-next-line require-await
          json: async () => ({}),
        });

        const expectedAddress = { cep: { value: '12345-678', loading: false } };

        const address = await onValidChange({ value: '12345-678', updateState });

        expect(updateState).toHaveBeenCalledWith(expectedAddress);
        expect(address).toStrictEqual(expectedAddress);
      });
    });

    describe('getAddress', () => {
      it('should return address data for valid CEP', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          // eslint-disable-next-line require-await
          json: async () => ({
            cep: '12345678',
            state: 'SP',
            city: 'São Paulo',
            neighborhood: 'Centro',
            street: 'Rua A',
          }),
        });

        const address = await getAddress('12345-678');

        expect(address).toStrictEqual({
          cep: '12345678',
          state: 'SP',
          city: 'São Paulo',
          neighborhood: 'Centro',
          street: 'Rua A',
        });
      });

      it('should return "undefined" for invalid CEP', async () => {
        global.fetch.mockResolvedValueOnce({
          status: 404,
          ok: false,
        });

        expect(await getAddress('00000000')).toBeUndefined();
      });

      it('should return "undefined" for invalid response', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        expect(await getAddress('00000000')).toBeUndefined();
      });

      it('should return "undefined" for invalid CEP in response', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          // eslint-disable-next-line require-await
          json: async () => ({
            message: 'Cep não encontrado',
          }),
        });

        expect(await getAddress('00000000')).toBeUndefined();
      });

      it('should abort first request if called again', async () => {
        global.fetch
          .mockImplementationOnce(
            (_, { signal }) =>
              new Promise((_, reject) => {
                signal.addEventListener('abort', () => {
                  const reason = new Error('AbortError');
                  reason.name = 'AbortError';
                  reject(reason);
                });
              }),
          )
          .mockImplementationOnce(() => {
            return Promise.resolve({
              ok: true,
              status: 200,
              // eslint-disable-next-line require-await
              json: async () => ({ cep: '87654321' }),
            });
          });

        const firstCall = getAddress('12345678');

        await vi.waitFor(() => {
          expect(global.fetch).toHaveBeenCalledOnce();
        });

        const secondCall = await getAddress('87654321');

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(secondCall).toStrictEqual({ cep: '87654321' });
        await expect(firstCall).resolves.toBeUndefined();
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('should log warning for fetch error', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        await getAddress('12345678');

        expect(console.warn).toHaveBeenCalledWith(
          'Falha ao obter dados do CEP',
          '12345678',
          '- Erro:',
          'Network error',
        );
      });
    });

    describe('format', () => {
      it('should format CEP correctly', () => {
        expect(format('12345678')).toBe('12345-678');
      });

      it('should handle incomplete CEP', () => {
        expect(format('12345')).toBe('12345');
        expect(format('12345-')).toBe('12345');
        expect(format('12345-6')).toBe('12345-6');
      });
    });

    describe('prepare', () => {
      it('should remove non-numeric characters', () => {
        expect(prepare('12345-678')).toBe('12345678');
      });

      it('should handle already cleaned CEP', () => {
        expect(prepare('12345678')).toBe('12345678');
      });
    });
  });
});
