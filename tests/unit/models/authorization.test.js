import { describe, expect, it, vi } from 'vitest';

// --- Mocks defined BEFORE imports ---

// Mock ValidationError using vi.hoisted to ensure it's created before
const { ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    constructor(props) {
      super(props.message);
      this.name = 'ValidationError';
    }
  }
  return { ValidationError };
});

// 1. Mock errors module (correct path)
vi.mock('errors', () => ({
  ValidationError,
  ForbiddenError: class extends Error {
    constructor(props) {
      super(props.message);
      this.name = 'ForbiddenError';
    }
  },
}));

// 2. Mock features list
vi.mock('models/user-features', () => ({
  default: new Set(['create:user', 'update:user', 'update:content', 'update:content:others', 'ban:user']),
}));

// 3. Mock validator
vi.mock('models/validator.js', () => ({
  default: {},
}));

// Import module AFTER mocks
import authorization from 'models/authorization.js';

// Extract 'can' function from module
const { can } = authorization;

// --- Test Suite for 'can' ---

describe('Authorization: can(user, feature, resource)', () => {
  describe('Input Validation (internal calls)', () => {
    it('should throw "ValidationError" if user is null', () => {
      expect(() => can(null, 'update:user')).toThrow(ValidationError);
    });

    it('should throw "ValidationError" if user.features is not an array', () => {
      expect(() => can({ id: '123' }, 'update:user')).toThrow(ValidationError);
    });

    it('should throw "ValidationError" if feature is null', () => {
      const mockUser = { id: 'user-123', features: ['update:user'] };
      expect(() => can(mockUser, null)).toThrow(ValidationError);
    });

    it('should throw "ValidationError" if feature does not exist in list', () => {
      const mockUser = { id: 'user-123', features: ['update:user'] };
      expect(() => can(mockUser, 'feature:nonexistent')).toThrow(ValidationError);
    });
  });

  describe('Basic Permission Logic', () => {
    it('should return false when user does not have the feature', () => {
      const user = { id: 1, features: [] };
      const feature = 'update:user';
      expect(can(user, feature, null)).toBe(false);
    });
  });

  describe('Specific Logic - update:user', () => {
    it('should return true when user owns the profile', () => {
      const user = { id: 1, features: ['update:user'] };
      const feature = 'update:user';
      const resource = { id: 1 };
      expect(can(user, feature, resource)).toBe(true);
    });

    it('should return false when user does not own the profile', () => {
      const user = { id: 1, features: ['update:user'] };
      const feature = 'update:user';
      const resource = { id: 2 };
      expect(can(user, feature, resource)).toBe(false);
    });

    it('should return falsy when profile does not exist (resource is NULL)', () => {
      const user = { id: 1, features: ['update:user'] };
      const feature = 'update:user';
      const resource = null;
      expect(can(user, feature, resource)).toBeFalsy();
    });
  });

  describe('Specific Logic - update:content', () => {
    it('should return true when user owns the content', () => {
      const user = { id: 1, features: ['update:content'] };
      const feature = 'update:content';
      const resource = { owner_id: 1 };
      expect(can(user, feature, resource)).toBe(true);
    });

    it('should return true when user does not own content but has special permission', () => {
      const user = { id: 1, features: ['update:content', 'update:content:others'] };
      const feature = 'update:content';
      const resource = { owner_id: 2 };
      expect(can(user, feature, resource)).toBe(true);
    });

    it('should return false when user does not own content and has no special permission', () => {
      const user = { id: 1, features: ['update:content'] };
      const feature = 'update:content';
      const resource = { owner_id: 2 };
      expect(can(user, feature, resource)).toBe(false);
    });

    it('should return false when content has no owner (owner_id is NULL)', () => {
      const user = { id: 1, features: ['update:content'] };
      const feature = 'update:content';
      const resource = { owner_id: null };
      expect(can(user, feature, resource)).toBe(false);
    });
  });

  describe('Generic Logic (Fall-through)', () => {
    it('should return true when resource is null (feature not in switch)', () => {
      const user = { id: 1, features: ['create:user'] };
      const feature = 'create:user';
      const resource = null;
      expect(can(user, feature, resource)).toBe(true);
    });

    it('should return false when resource is not null (feature not in switch)', () => {
      const user = { id: 1, features: ['create:user'] };
      const feature = 'create:user';
      const resource = { id: 1 };
      expect(can(user, feature, resource)).toBe(false);
    });
  });
});
