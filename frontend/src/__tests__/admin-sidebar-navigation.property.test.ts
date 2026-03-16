import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import {
  isAdminNavItemActive,
  shouldCloseSidebarOnNavigate,
} from '@/features/admin/hooks/use-admin-sidebar-navigation';

describe('admin sidebar navigation helpers', () => {
  it('closes sidebar iff mobile width and sidebar is open', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2000 }), fc.boolean(), (width, open) => {
        const result = shouldCloseSidebarOnNavigate(width, open, 768);
        expect(result).toBe(open && width < 768);
      }),
      { numRuns: 200 }
    );
  });

  it('root admin nav is active only on exact admin dashboard path', () => {
    fc.assert(
      fc.property(fc.string(), (tail) => {
        const pathname = tail.startsWith('/') ? tail : `/${tail}`;
        const exactResult = isAdminNavItemActive('/admin-analysis', '/admin-analysis');
        const nestedResult = isAdminNavItemActive(
          `/admin-analysis${pathname}`,
          '/admin-analysis'
        );

        expect(exactResult).toBe(true);
        if (pathname.length > 1) {
          expect(nestedResult).toBe(false);
        }
      }),
      { numRuns: 120 }
    );
  });

  it('non-root admin nav uses prefix matching', () => {
    fc.assert(
      fc.property(fc.array(fc.stringMatching(/^[a-z0-9_-]+$/), { minLength: 1, maxLength: 4 }), (parts) => {
        const href = `/admin-analysis/${parts[0]}`;
        const nestedPath = `/admin-analysis/${parts.join('/')}`;

        expect(isAdminNavItemActive(nestedPath, href)).toBe(true);
      }),
      { numRuns: 120 }
    );
  });
});
