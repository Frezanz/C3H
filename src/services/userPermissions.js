import { createPermissions } from '@/services/permissions';

export const PROFILES = {
  PublicProfile: { label: 'Public', isDefault: false, isPublic: true, canManageTeam: false, reportsTo: null },
};

const TABLE_PERMISSIONS = {};

export const { getProfileMeta, getTableAccess, getFieldAccess } = createPermissions(PROFILES, TABLE_PERMISSIONS);
