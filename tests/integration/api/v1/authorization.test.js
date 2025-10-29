import authorization from '../../../../models/authorization.js';

const { can } = authorization;
describe('Função can(user, feature, resource)', () => {
  const user_no_feature = { id: 1, features: [] };
  const user_owner = { id: 1, features: ['update:user', 'update:content', 'read'] };
  const user_admin = { id: 99, features: ['update:content:others', 'update:content', 'read'] };
  const res_owner_1 = { id: 1, owner_id: 1 };
  const res_other = { id: 2, owner_id: 2 };
  const res_no_id = { owner_id: 1 };
  const res_no_owner = { id: 1 };
  it('CT1 - Feature não permitida', () => {
    const result = can(user_no_feature, 'update:user', res_owner_1);
    expect(result).toBe(false);
  });
  it("CT2 - Pode 'update:user' (Dono)", () => {
    const result = can(user_owner, 'update:user', res_owner_1);
    expect(result).toBe(true);
  });
  it("CT3 - Não pode 'update:user' (Não dono)", () => {
    const result = can(user_owner, 'update:user', res_other);
    expect(result).toBe(false);
  });
  it("CT4 - Não pode 'update:user' (Recurso sem ID)", () => {
    const result = can(user_owner, 'update:user', res_no_id);
    expect(result).toBe(false);
  });
  it("CT5 - Pode 'update:content' (Dono)", () => {
    const result = can(user_owner, 'update:content', res_owner_1);
    expect(result).toBe(true);
  });
  it("CT6 - Não pode 'update:content' (Recurso sem Dono)", () => {
    const result = can(user_owner, 'update:content', res_no_owner);
    expect(result).toBe(false);
  });
  it("CT7 - Não pode 'update:content' (Não dono)", () => {
    const result = can(user_owner, 'update:content', res_other);
    expect(result).toBe(false);
  });
  it("CT8 - Pode 'update:content' (Não dono, mas tem permissão de outros)", () => {
    const result = can(user_admin, 'update:content', res_other);
    expect(result).toBe(true);
  });
  it('CT9 - Pode feature genérica (sem recurso)', () => {
    const user_owner = { id: 1, features: ['update:user', 'update:content', 'read:user'] };

    const result = can(user_owner, 'read:user');
    expect(result).toBe(true);
  });
  it('CT10 - Não pode feature genérica (com recurso)', () => {
    const result = can(user_owner, 'read:user', res_owner_1);
    expect(result).toBe(false);
  });
});
