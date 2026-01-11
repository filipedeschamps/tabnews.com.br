import { act, renderHook, waitFor } from '@testing-library/react';

import { useForm } from '.';

describe('useForm', () => {
  const initialConfig = {
    username: {
      value: '',
      error: 'Initial error',
      format: (value) => value.toLowerCase(),
      prepare: (value) => value.trim(),
      validateOnChange: (value) => (value.length > 8 ? 'Too long' : null),
      validateOnBlurAndSubmit: (value) => (value.length < 3 ? 'Must be at least 3 characters' : null),
    },
    email: {
      value: 'email@example.com',
      customProp: 'custom',
    },
    password: {
      value: '',
      validateOnBlurAndSubmit: (value) => (value.length < 6 ? 'Must be at least 6 characters' : null),
    },
    cep: {
      value: '',
      validateOnChange: (value) => (value.length < 8 ? 'Too short' : null),
      onValidChange: async ({ value, updateState, updateFields }) => {
        updateState({ cep: { loading: true } });
        await new Promise((resolve) => setTimeout(resolve));
        updateFields({
          cep: { loading: false },
          city: { value: `São Paulo - ${value}` },
        });
      },
    },
    city: {
      value: '',
    },
    value_undefined: undefined,
  };

  const expectedInitialState = {
    username: { value: '', error: 'Initial error' },
    email: { value: 'email@example.com', customProp: 'custom' },
    password: { value: '' },
    cep: { value: '' },
    city: { value: '' },
    value_undefined: { value: undefined },
  };

  describe('initialization', () => {
    it('should initialize form state and processors correctly', () => {
      const { result } = renderHook(() => useForm(initialConfig));
      const { getFieldProps, handleSubmit, state, updateFields, updateProcessors, updateState } = result.current;

      expect(state).toStrictEqual(expectedInitialState);
      expect(handleSubmit).toBeInstanceOf(Function);
      expect(updateFields).toBeInstanceOf(Function);
      expect(updateProcessors).toBeInstanceOf(Function);
      expect(updateState).toBeInstanceOf(Function);

      Object.keys(initialConfig).forEach((key) => {
        expect(getFieldProps(key)).toStrictEqual({
          name: key,
          ...expectedInitialState[key],
          onChange: expect.any(Function),
          onBlur: expect.any(Function),
        });
      });
    });

    it('should initialize form state empty', () => {
      const expectedResult = {
        state: {},
        getFieldProps: expect.any(Function),
        handleSubmit: expect.any(Function),
        updateFields: expect.any(Function),
        updateProcessors: expect.any(Function),
        updateState: expect.any(Function),
      };

      const undef = renderHook(() => useForm()).result.current;
      expect(undef).toStrictEqual(expectedResult);

      const empty = renderHook(() => useForm({})).result.current;
      expect(empty).toStrictEqual(expectedResult);
    });

    describe('Missing configuration', () => {
      it('should throw new Error("Field not found in config.")', () => {
        const { result } = renderHook(() => useForm(initialConfig));
        expect(() => result.current.getFieldProps('notFound')).toThrowError('Field "notFound" not found in config.');
      });

      it('should return hidden field', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const { result } = renderHook(() => useForm(initialConfig));
        const hiddenField = result.current.getFieldProps('notFound');
        process.env.NODE_ENV = originalEnv;

        expect(hiddenField).toStrictEqual({ hidden: true });
      });
    });
  });

  describe('update state', () => {
    it('should update via "updateState"', () => {
      const { result } = renderHook(() => useForm(initialConfig));
      const { updateState } = result.current;

      act(() => updateState({ username: { value: 'newUser' } }));

      expect(result.current.state.username.value).toBe('newUser');
    });

    it('should update via "updateFields"', () => {
      const { result } = renderHook(() => useForm(initialConfig));
      const { updateFields } = result.current;

      act(() => updateFields({ email: { value: 'newEmail@example.com' } }));

      expect(result.current.state.email.value).toBe('newEmail@example.com');
    });

    it('should update value on handle change', () => {
      const { result } = renderHook(() => useForm(initialConfig));

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'def' } });
      });

      const { state } = result.current;
      expect(state.username.value).toBe('def');
    });

    it('should update value on handle check', () => {
      const { result } = renderHook(() => useForm({ box: { checked: false } }));

      act(() => {
        const { onChange } = result.current.getFieldProps('box');
        onChange({ target: { type: 'checkbox', checked: true } });
      });

      expect(result.current.state.box.checked).toBe(true);

      act(() => {
        const { onChange } = result.current.getFieldProps('box');
        onChange({ target: { type: 'checkbox', checked: false } });
      });

      expect(result.current.state.box.checked).toBe(false);
    });

    it('should format field value on change', () => {
      const initialConfigWithFormat = {
        ...initialConfig,
        username: {
          ...initialConfig.username,
          format: (value) => value.toUpperCase(),
        },
      };

      const { result } = renderHook(() => useForm(initialConfigWithFormat));

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'ghi' } });
      });

      const { state } = result.current;
      expect(state.username.value).toBe('GHI');
    });

    it('should prepare field value on blur', () => {
      const initialConfigWithPrepare = {
        ...initialConfig,
        username: {
          ...initialConfig.username,
          prepare: (value) => value.trim(),
        },
      };

      const { result } = renderHook(() => useForm(initialConfigWithPrepare));

      act(() => {
        const event = { target: { value: '  cd  ' } };
        const { onChange, onBlur } = result.current.getFieldProps('username');
        onChange(event);
        onBlur(event);
      });

      const { username } = result.current.state;
      expect(username.value).toBe('  cd  ');
      expect(username.error).toBe('Must be at least 3 characters');
    });

    it('should update other fields via "onValidChange"', () => {
      const { result } = renderHook(() =>
        useForm({
          ...initialConfig,
          username: {
            ...initialConfig.username,
            onValidChange: ({ updateState }) => {
              updateState({
                username: { updated: true },
                email: { value: 'newEmail' },
              });
            },
          },
        }),
      );

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'abc' } });
      });

      expect(result.current.state.username.value).toBe('abc');
      expect(result.current.state.username.updated).toBe(true);
      expect(result.current.state.email.value).toBe('newEmail');
    });

    it('should update asynchronously via "onValidChange"', async () => {
      const { result } = renderHook(() => useForm(initialConfig));

      act(() => {
        const { onChange } = result.current.getFieldProps('cep');
        onChange({ target: { value: '12345678' } });
      });

      expect(result.current.state.cep.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.state.cep.loading).toBe(false);
        expect(result.current.state.city.value).toBe('São Paulo - 12345678');
      });
    });
  });

  describe('update processors', () => {
    it('should update via "updateProcessors"', () => {
      const { result } = renderHook(() => useForm(initialConfig));

      const { updateProcessors } = result.current;
      act(() => updateProcessors({ username: { format: (value) => value.toUpperCase() } }));

      const { onChange } = result.current.getFieldProps('username');
      act(() => onChange({ target: { value: 'abc' } }));

      const { state } = result.current;
      expect(state.username.value).toBe('ABC');
    });

    it('should update via "updateFields"', () => {
      const { result } = renderHook(() => useForm(initialConfig));

      const { updateFields } = result.current;
      act(() => updateFields({ username: { format: (value) => value.trim() } }));

      const { onChange } = result.current.getFieldProps('username');
      act(() => onChange({ target: { value: '  abc  ' } }));

      const { state } = result.current;
      expect(state.username.value).toBe('abc');
    });

    it('should update via "onValidChange" and "updateProcessors"', () => {
      const { result } = renderHook(() =>
        useForm({
          ...initialConfig,
          username: {
            ...initialConfig.username,
            onValidChange: ({ updateProcessors }) => {
              updateProcessors({ username: { format: (value) => value.toUpperCase() } });
            },
          },
        }),
      );

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'a' } });
      });

      expect(result.current.state.username.value).toBe('a');

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'ab' } });
      });

      expect(result.current.state.username.value).toBe('AB');
    });

    it('should update via "onValidChange" and "updateFields"', () => {
      const { result } = renderHook(() =>
        useForm({
          ...initialConfig,
          username: {
            ...initialConfig.username,
            onValidChange: ({ updateFields }) => {
              updateFields({ username: { format: (value) => value.toUpperCase() } });
            },
          },
        }),
      );

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'a' } });
      });

      expect(result.current.state.username.value).toBe('a');

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'ab' } });
      });

      expect(result.current.state.username.value).toBe('AB');
    });
  });

  describe('update state and processors', () => {
    it('should update via "updateFields"', () => {
      const { result } = renderHook(() => useForm(initialConfig));
      const { updateFields } = result.current;

      act(() => {
        updateFields({
          username: { value: 'newUser' },
          email: {
            validateOnBlurAndSubmit: () => 'Invalid email',
          },
        });
      });

      const { onBlur, onChange } = result.current.getFieldProps('email');
      const event = { target: { value: 'invalidMail' } };

      act(() => {
        onChange(event);
        onBlur(event);
      });

      expect(result.current.state.username.value).toBe('newUser');
      expect(result.current.state.email.value).toBe('invalidMail');
      expect(result.current.state.email.error).toBe('Invalid email');
    });

    it('should update via "onValidChange" and "updateFields"', () => {
      const { result } = renderHook(() =>
        useForm({
          ...initialConfig,
          username: {
            ...initialConfig.username,
            onValidChange: ({ updateFields }) => {
              updateFields({
                username: { format: (value) => value.toUpperCase() },
                password: { value: 'newPassword' },
              });
            },
          },
        }),
      );

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'c' } });
      });

      expect(result.current.state.username.value).toBe('c');
      expect(result.current.state.password.value).toBe('newPassword');

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'cd' } });
      });

      expect(result.current.state.username.value).toBe('CD');
    });
  });

  describe('validation', () => {
    it('should update field value and validate instantly', () => {
      const { result } = renderHook(() => useForm(initialConfig));
      const { onChange, value, error } = result.current.getFieldProps('username');
      expect(value).toBe('');
      expect(error).toBe('Initial error');

      act(() => onChange({ target: { value: '123456789' } }));

      const { state } = result.current;
      expect(state.username.value).toBe('123456789');
      expect(state.username.error).toBe('Too long');
    });

    it('should validate field on blur', () => {
      const { result } = renderHook(() => useForm(initialConfig));
      const { getFieldProps } = result.current;
      const { onChange, onBlur } = getFieldProps('username');
      const event = { target: { value: 'ab' } };

      act(() => {
        onBlur(event);
        onChange(event);
      });

      expect(result.current.state.username.value).toBe('ab');
      expect(result.current.state.username.error).toBe('Must be at least 3 characters');
    });

    it('should skip "onValidChange" if there is a validation error', () => {
      const { result } = renderHook(() => useForm(initialConfig));

      act(() => {
        const { onChange } = result.current.getFieldProps('cep');
        onChange({ target: { value: '1234567' } });
      });

      expect(result.current.state.cep.error).toBe('Too short');
      expect(result.current.state.cep.loading).toBeUndefined();
      expect(result.current.state.city.value).toBe('');
    });

    it('should not call "updateState" if "validateOnBlurAndSubmit" returns null', () => {
      const { result } = renderHook(() => useForm(initialConfig));

      act(() => {
        const { onBlur } = result.current.getFieldProps('username');
        onBlur({ target: { value: 'abcdef' } });
      });

      expect(result.current.state.username.error).toBe('Initial error');
    });
  });

  describe('submission', () => {
    it('should handle form submission', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => useForm(initialConfig));
      const { getFieldProps } = result.current;

      act(() => {
        getFieldProps('username').onChange({ target: { value: 'abcdef' } });
        getFieldProps('email').onChange({ target: { value: 'test@example.com' } });
        getFieldProps('password').onChange({ target: { value: 'password' } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'abcdef',
        email: 'test@example.com',
        password: 'password',
        cep: '',
        city: '',
        value_undefined: undefined,
      });
    });

    it('should handle form submission with prepared values', () => {
      const onSubmit = vi.fn();
      const initialConfigWithPrepare = {
        ...initialConfig,
        username: {
          ...initialConfig.username,
          prepare: (value) => value.trim(),
        },
      };

      const { result } = renderHook(() => useForm(initialConfigWithPrepare));
      const { getFieldProps } = result.current;

      act(() => {
        getFieldProps('username').onChange({ target: { value: '  abcdefg  ' } });
        getFieldProps('email').onChange({ target: { value: 'test@example.com' } });
        getFieldProps('password').onChange({ target: { value: 'password' } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'abcdefg',
        email: 'test@example.com',
        password: 'password',
        cep: '',
        city: '',
        value_undefined: undefined,
      });
    });

    it('should use checkbox value on form submission', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          box1: { checked: true },
          box2: { checked: false },
        }),
      );
      const { getFieldProps } = result.current;

      act(() => {
        getFieldProps('box1').onChange({ target: { type: 'checkbox', checked: false } });
        getFieldProps('box2').onChange({ target: { type: 'checkbox', checked: true } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).toHaveBeenCalledWith({
        box1: false,
        box2: true,
      });
    });

    it('should submit updated data via "updateState"', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          ...initialConfig,
          username: {
            ...initialConfig.username,
            onValidChange: ({ updateState }) => {
              updateState({
                email: { value: 'onValidChange@mail.com' },
                password: { value: 'onValidChange' },
              });
            },
          },
        }),
      );

      act(() => {
        const { onBlur, onChange } = result.current.getFieldProps('email');
        onChange({ target: { value: 'onChange@mail.com' } });
        onBlur({ target: { value: 'onBlur@mail.com' } });
      });

      expect(result.current.state.email.value).toBe('onChange@mail.com');

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'onChange' } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'onchange',
        email: 'onValidChange@mail.com',
        password: 'onValidChange',
        cep: '',
        city: '',
        value_undefined: undefined,
      });
    });

    it('should submit updated data via "updateFields"', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          ...initialConfig,
          username: {
            ...initialConfig.username,
            onValidChange: ({ updateFields }) => {
              updateFields({
                email: { value: 'onValidChange@mail.com' },
                password: { value: 'onValidChange' },
              });
            },
          },
        }),
      );

      act(() => {
        const { onBlur, onChange } = result.current.getFieldProps('email');
        onChange({ target: { value: 'onChange@mail.com' } });
        onBlur({ target: { value: 'onBlur@mail.com' } });
      });

      expect(result.current.state.email.value).toBe('onChange@mail.com');

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'onChange' } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'onchange',
        email: 'onValidChange@mail.com',
        password: 'onValidChange',
        cep: '',
        city: '',
        value_undefined: undefined,
      });
    });

    it('should not submit with erros', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => useForm(initialConfig));
      const { getFieldProps } = result.current;

      act(() => {
        getFieldProps('username').onChange({ target: { value: 'ab' } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should skip disabled fields during submission with "submitDisabled: false"', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm(
          {
            ...initialConfig,
            username: { ...initialConfig.username, disabled: true },
          },
          {
            submitDisabled: false,
          },
        ),
      );
      const { getFieldProps } = result.current;

      act(() => {
        getFieldProps('username').onChange({ target: { value: 'ab' } });
        getFieldProps('email').onChange({ target: { value: 'valid@example.com' } });
        getFieldProps('password').onChange({ target: { value: 'validPass' } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).toHaveBeenCalledWith({
        email: 'valid@example.com',
        password: 'validPass',
        cep: '',
        city: '',
        value_undefined: undefined,
      });
      expect(result.current.state.username.value).toBe('ab');
    });

    it('should skip hidden fields during submission', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          ...initialConfig,
          username: { ...initialConfig.username, hidden: true },
        }),
      );
      const { getFieldProps } = result.current;

      act(() => {
        getFieldProps('email').onChange({ target: { value: 'valid@example.com' } });
        getFieldProps('password').onChange({ target: { value: 'validPass' } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).toHaveBeenCalledWith({
        email: 'valid@example.com',
        password: 'validPass',
        cep: '',
        city: '',
        value_undefined: undefined,
      });
      expect(result.current.state.username.value).toBe('');
    });

    it('should not skip hidden fields during submission with "submitHidden: true"', () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm(
          {
            ...initialConfig,
            username: { ...initialConfig.username, hidden: true },
          },
          {
            submitHidden: true,
          },
        ),
      );
      const { getFieldProps } = result.current;

      act(() => {
        getFieldProps('username').onChange({ target: { value: 'abcdef' } });
        getFieldProps('email').onChange({ target: { value: 'valid@example.com' } });
        getFieldProps('password').onChange({ target: { value: 'validPass' } });
      });

      const { handleSubmit } = result.current;

      act(() => handleSubmit(onSubmit)({ preventDefault: () => {} }));

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'abcdef',
        email: 'valid@example.com',
        password: 'validPass',
        cep: '',
        city: '',
        value_undefined: undefined,
      });
    });
  });

  describe('event handlers', () => {
    it('should call "onChange" when provided', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useForm(initialConfig, { onChange }));

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'abcdef' } });
      });

      expect(onChange).toHaveBeenCalledWith(
        { target: { value: 'abcdef' } },
        {
          name: 'username',
          value: 'abcdef',
          error: null,
          isValid: false,
          state: expectedInitialState,
          updateFields: expect.any(Function),
          updateProcessors: expect.any(Function),
          updateState: expect.any(Function),
        },
      );
    });

    it('should call "onBlur" when provided', () => {
      const onBlur = vi.fn();
      const { result } = renderHook(() => useForm(initialConfig, { onBlur }));

      act(() => {
        const { onBlur } = result.current.getFieldProps('username');
        onBlur({ target: { value: 'abcdef' } });
      });

      expect(onBlur).toHaveBeenCalledWith(
        { target: { value: 'abcdef' } },
        {
          name: 'username',
          preparedValue: 'abcdef',
          error: null,
          state: expectedInitialState,
          updateFields: expect.any(Function),
          updateProcessors: expect.any(Function),
          updateState: expect.any(Function),
        },
      );
    });

    it('should call "onStateChange" on "onChange" event', () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() => useForm(initialConfig, { onStateChange }));

      act(() => {
        const { onChange } = result.current.getFieldProps('username');
        onChange({ target: { value: 'abcdef' } });
      });

      expect(onStateChange).toHaveBeenCalledWith({
        username: {
          value: 'abcdef',
          error: null,
          isValid: false,
        },
      });
    });

    it('should call "onStateChange" when call "updateState"', () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() => useForm(initialConfig, { onStateChange }));
      const { updateState } = result.current;
      const updatedState = { username: { value: 'abcdef' } };

      act(() => updateState(updatedState));

      expect(onStateChange).toHaveBeenCalledWith(updatedState);
    });
  });
});
