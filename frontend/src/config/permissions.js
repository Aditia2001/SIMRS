export const MODULE_PERMISSIONS = {
  dashboard: [
    "ADMIN",
    "REGISTRATION",
    "DOCTOR",
    "PHARMACY",
    "LABORATORY",
    "CASHIER",
  ],
  patients: ["ADMIN", "REGISTRATION", "DOCTOR"],
  visits: ["ADMIN", "REGISTRATION", "DOCTOR"],
  medicalRecords: ["ADMIN", "DOCTOR"],
  medicalActions: ["ADMIN", "DOCTOR"],
  pharmacy: ["ADMIN", "PHARMACY", "DOCTOR"],
  laboratory: ["ADMIN", "LABORATORY", "DOCTOR"],
  finance: ["ADMIN", "CASHIER"],
};

export function canAccess(user, module) {
  const roleCode = user?.role?.code;

  if (!roleCode) return false;

  return MODULE_PERMISSIONS[module]?.includes(roleCode) ?? false;
}
