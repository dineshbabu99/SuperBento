import React, { useState, useEffect } from 'react';
import {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useUpdateRolePermissionsMutation,
  type Role,
} from '../../users/api/systemPeopleApi';
import { Button } from '../../../shared/ui/button';

export const RolesPage: React.FC = () => {
  const { data: roles, isLoading: isLoadingRoles } = useGetRolesQuery();
  const { data: permissionsGrouped, isLoading: isLoadingPermissions } = useGetPermissionsQuery();
  const [updateRolePermissions, { isLoading: isSaving }] = useUpdateRolePermissionsMutation();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // Automatically select the first role when loaded
  useEffect(() => {
    if (roles && roles.length > 0 && !selectedRole) {
      handleSelectRole(roles[0]);
    }
  }, [roles]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    const initialChecked = role.permissions.map((p) => p.permissionId);
    setCheckedIds(initialChecked);
  };

  const handleCheckboxToggle = (permId: string) => {
    if (checkedIds.includes(permId)) {
      setCheckedIds(checkedIds.filter((id) => id !== permId));
    } else {
      setCheckedIds([...checkedIds, permId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await updateRolePermissions({
        id: selectedRole.id,
        permissionIds: checkedIds,
      }).unwrap();
      alert('Permissions saved successfully!');
    } catch {
      alert('Failed to save permissions.');
    }
  };

  const isLoading = isLoadingRoles || isLoadingPermissions;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles & Permissions Matrix</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure granular security control policies across system modules</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading matrix details...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left panel: Roles List */}
          <div className="lg:col-span-1 bg-card border rounded-lg p-4 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
              System Roles
            </h2>
            <div className="space-y-1">
              {roles?.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                    selectedRole?.id === role.id
                      ? 'bg-primary text-white shadow-md'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <p>{role.name}</p>
                  <p className={`text-[10px] mt-0.5 ${selectedRole?.id === role.id ? 'text-blue-100' : 'text-muted-foreground font-normal'}`}>
                    {role.isSystem ? 'System Defined' : 'Custom'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Permissions Matrix */}
          <div className="lg:col-span-3 bg-card border rounded-lg flex flex-col overflow-hidden">
            {selectedRole ? (
              <>
                <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h2 className="font-semibold text-base text-primary">{selectedRole.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedRole.description ?? 'No description'}</p>
                  </div>
                  <Button onClick={handleSavePermissions} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Permissions Matrix'}
                  </Button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                  {Array.isArray(permissionsGrouped) &&
                    permissionsGrouped.map(({ module: moduleName, permissions: perms }) => (
                      <div key={moduleName} className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary border-b pb-1">
                          {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                className="mt-1 rounded border-border text-primary focus:ring-primary/50"
                                checked={checkedIds.includes(perm.id)}
                                onChange={() => handleCheckboxToggle(perm.id)}
                              />
                              <div>
                                <p className="text-xs font-mono font-bold text-foreground">{perm.name}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{perm.description ?? 'No description'}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-muted-foreground my-auto">
                Select a role to inspect permissions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default RolesPage;
