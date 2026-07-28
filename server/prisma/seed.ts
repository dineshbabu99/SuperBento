import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────
// SYSTEM ROLES
// ─────────────────────────────────────────────────────────
const SYSTEM_ROLES = [
  { name: 'Super Admin', slug: 'super-admin', description: 'Full system access — all permissions', isSystem: true },
  { name: 'Company Admin', slug: 'company-admin', description: 'Company-level administration', isSystem: true },
  { name: 'Kitchen Manager', slug: 'kitchen-manager', description: 'Manages kitchen operations and production', isSystem: true },
  { name: 'Production Manager', slug: 'production-manager', description: 'Oversees food production planning', isSystem: true },
  { name: 'Inventory Manager', slug: 'inventory-manager', description: 'Manages stock, ingredients, and warehouse', isSystem: true },
  { name: 'Purchase Manager', slug: 'purchase-manager', description: 'Handles vendor purchases and procurement', isSystem: true },
  { name: 'Delivery Manager', slug: 'delivery-manager', description: 'Manages delivery routes and executives', isSystem: true },
  { name: 'Finance Manager', slug: 'finance-manager', description: 'Finance, invoicing, and reporting', isSystem: true },
  { name: 'HR Manager', slug: 'hr-manager', description: 'Human resources and payroll', isSystem: true },
  { name: 'Dietitian', slug: 'dietitian', description: 'Nutrition planning and meal customization', isSystem: true },
  { name: 'Customer Support', slug: 'customer-support', description: 'Customer onboarding and support', isSystem: true },
  { name: 'Delivery Executive', slug: 'delivery-executive', description: 'Field delivery personnel', isSystem: true },
  { name: 'Customer', slug: 'customer', description: 'End customer with limited portal access', isSystem: true },
];

// ─────────────────────────────────────────────────────────
// ALL PERMISSIONS (current + future modules)
// ─────────────────────────────────────────────────────────
const PERMISSIONS = [
  // Users
  { module: 'users', action: 'read', name: 'users:read', description: 'View users' },
  { module: 'users', action: 'write', name: 'users:write', description: 'Create and update users' },
  { module: 'users', action: 'delete', name: 'users:delete', description: 'Delete users' },
  { module: 'users', action: 'manage-roles', name: 'users:manage-roles', description: 'Assign roles to users' },

  // Roles
  { module: 'roles', action: 'read', name: 'roles:read', description: 'View roles' },
  { module: 'roles', action: 'write', name: 'roles:write', description: 'Create and update roles' },
  { module: 'roles', action: 'delete', name: 'roles:delete', description: 'Delete roles' },
  { module: 'roles', action: 'manage-permissions', name: 'roles:manage-permissions', description: 'Assign permissions to roles' },

  // Permissions
  { module: 'permissions', action: 'read', name: 'permissions:read', description: 'View permissions' },

  // Audit Logs
  { module: 'audit-logs', action: 'read', name: 'audit-logs:read', description: 'View audit logs' },

  // Dashboard
  { module: 'dashboard', action: 'read', name: 'dashboard:read', description: 'View dashboard' },
  { module: 'dashboard', action: 'analytics', name: 'dashboard:analytics', description: 'View advanced analytics' },

  // Customers
  { module: 'customers', action: 'read', name: 'customers:read', description: 'View customers' },
  { module: 'customers', action: 'write', name: 'customers:write', description: 'Create and update customers' },
  { module: 'customers', action: 'delete', name: 'customers:delete', description: 'Delete customers' },
  { module: 'customers', action: 'export', name: 'customers:export', description: 'Export customer data' },

  // Subscriptions
  { module: 'subscriptions', action: 'read', name: 'subscriptions:read', description: 'View subscriptions' },
  { module: 'subscriptions', action: 'write', name: 'subscriptions:write', description: 'Create and update subscriptions' },
  { module: 'subscriptions', action: 'delete', name: 'subscriptions:delete', description: 'Cancel subscriptions' },
  { module: 'subscriptions', action: 'manage-plans', name: 'subscriptions:manage-plans', description: 'Manage meal plans' },

  // Kitchen
  { module: 'kitchen', action: 'read', name: 'kitchen:read', description: 'View kitchen data' },
  { module: 'kitchen', action: 'write', name: 'kitchen:write', description: 'Update kitchen data' },
  { module: 'kitchen', action: 'manage', name: 'kitchen:manage', description: 'Full kitchen management' },

  // Production
  { module: 'production', action: 'read', name: 'production:read', description: 'View production plans' },
  { module: 'production', action: 'write', name: 'production:write', description: 'Create production plans' },
  { module: 'production', action: 'manage', name: 'production:manage', description: 'Full production management' },

  // Inventory
  { module: 'inventory', action: 'read', name: 'inventory:read', description: 'View inventory' },
  { module: 'inventory', action: 'write', name: 'inventory:write', description: 'Update inventory' },
  { module: 'inventory', action: 'manage', name: 'inventory:manage', description: 'Full inventory management' },
  { module: 'inventory', action: 'adjust', name: 'inventory:adjust', description: 'Make inventory adjustments' },

  // Purchases
  { module: 'purchases', action: 'read', name: 'purchases:read', description: 'View purchase orders' },
  { module: 'purchases', action: 'write', name: 'purchases:write', description: 'Create purchase orders' },
  { module: 'purchases', action: 'approve', name: 'purchases:approve', description: 'Approve purchase orders' },
  { module: 'purchases', action: 'manage', name: 'purchases:manage', description: 'Full purchase management' },

  // Vendors
  { module: 'vendors', action: 'read', name: 'vendors:read', description: 'View vendors' },
  { module: 'vendors', action: 'write', name: 'vendors:write', description: 'Create and update vendors' },
  { module: 'vendors', action: 'delete', name: 'vendors:delete', description: 'Delete vendors' },

  // Suppliers
  { module: 'suppliers', action: 'read', name: 'suppliers:read', description: 'View suppliers' },
  { module: 'suppliers', action: 'write', name: 'suppliers:write', description: 'Create and update suppliers' },
  { module: 'suppliers', action: 'delete', name: 'suppliers:delete', description: 'Delete suppliers' },

  // Orders
  { module: 'orders', action: 'read', name: 'orders:read', description: 'View orders' },
  { module: 'orders', action: 'write', name: 'orders:write', description: 'Create and update orders' },
  { module: 'orders', action: 'manage', name: 'orders:manage', description: 'Full order management' },

  // Delivery
  { module: 'delivery', action: 'read', name: 'delivery:read', description: 'View deliveries' },
  { module: 'delivery', action: 'write', name: 'delivery:write', description: 'Update deliveries' },
  { module: 'delivery', action: 'manage', name: 'delivery:manage', description: 'Full delivery management' },
  { module: 'delivery', action: 'assign', name: 'delivery:assign', description: 'Assign delivery executives' },

  // Finance
  { module: 'finance', action: 'read', name: 'finance:read', description: 'View financial data' },
  { module: 'finance', action: 'write', name: 'finance:write', description: 'Create financial records' },
  { module: 'finance', action: 'manage', name: 'finance:manage', description: 'Full finance management' },
  { module: 'finance', action: 'approve', name: 'finance:approve', description: 'Approve financial transactions' },
  { module: 'finance', action: 'export', name: 'finance:export', description: 'Export financial reports' },

  // HR
  { module: 'hr', action: 'read', name: 'hr:read', description: 'View HR records' },
  { module: 'hr', action: 'write', name: 'hr:write', description: 'Create and update HR records' },
  { module: 'hr', action: 'manage', name: 'hr:manage', description: 'Full HR management' },
  { module: 'hr', action: 'payroll', name: 'hr:payroll', description: 'Manage payroll' },

  // Reports
  { module: 'reports', action: 'read', name: 'reports:read', description: 'View reports' },
  { module: 'reports', action: 'export', name: 'reports:export', description: 'Export reports' },
  { module: 'reports', action: 'manage', name: 'reports:manage', description: 'Full report management' },

  // Settings
  { module: 'settings', action: 'read', name: 'settings:read', description: 'View settings' },
  { module: 'settings', action: 'write', name: 'settings:write', description: 'Update settings' },
  { module: 'settings', action: 'manage', name: 'settings:manage', description: 'Full settings management' },

  // Notifications
  { module: 'notifications', action: 'manage', name: 'notifications:manage', description: 'Manage system notifications' },

  // Branches
  { module: 'branches', action: 'read', name: 'branches:read', description: 'View branches' },
  { module: 'branches', action: 'write', name: 'branches:write', description: 'Create and update branches' },
  { module: 'branches', action: 'manage', name: 'branches:manage', description: 'Full branch management' },
];

// Role → Permissions mapping (non-super-admin roles)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'company-admin': [
    'users:read', 'users:write', 'users:delete', 'users:manage-roles',
    'roles:read', 'roles:write', 'roles:manage-permissions',
    'permissions:read', 'audit-logs:read',
    'dashboard:read', 'dashboard:analytics',
    'customers:read', 'customers:write', 'customers:export',
    'subscriptions:read', 'subscriptions:write', 'subscriptions:manage-plans',
    'kitchen:read', 'kitchen:write', 'kitchen:manage',
    'production:read', 'production:write', 'production:manage',
    'inventory:read', 'inventory:write', 'inventory:manage', 'inventory:adjust',
    'purchases:read', 'purchases:write', 'purchases:approve', 'purchases:manage',
    'vendors:read', 'vendors:write',
    'orders:read', 'orders:write', 'orders:manage',
    'delivery:read', 'delivery:write', 'delivery:manage', 'delivery:assign',
    'finance:read', 'finance:write', 'finance:manage', 'finance:approve', 'finance:export',
    'hr:read', 'hr:write', 'hr:manage',
    'reports:read', 'reports:export', 'reports:manage',
    'settings:read', 'settings:write', 'settings:manage',
    'branches:read', 'branches:write', 'branches:manage',
  ],
  'kitchen-manager': [
    'dashboard:read', 'kitchen:read', 'kitchen:write', 'kitchen:manage',
    'production:read', 'production:write', 'production:manage',
    'inventory:read', 'inventory:adjust',
    'orders:read', 'reports:read',
  ],
  'production-manager': [
    'dashboard:read', 'production:read', 'production:write', 'production:manage',
    'inventory:read', 'kitchen:read', 'orders:read', 'reports:read',
  ],
  'inventory-manager': [
    'dashboard:read', 'inventory:read', 'inventory:write', 'inventory:manage', 'inventory:adjust',
    'purchases:read', 'vendors:read', 'reports:read',
  ],
  'purchase-manager': [
    'dashboard:read', 'purchases:read', 'purchases:write', 'purchases:approve', 'purchases:manage',
    'vendors:read', 'vendors:write', 'inventory:read', 'finance:read', 'reports:read',
  ],
  'delivery-manager': [
    'dashboard:read', 'delivery:read', 'delivery:write', 'delivery:manage', 'delivery:assign',
    'orders:read', 'customers:read', 'reports:read',
  ],
  'finance-manager': [
    'dashboard:read', 'dashboard:analytics',
    'finance:read', 'finance:write', 'finance:manage', 'finance:approve', 'finance:export',
    'orders:read', 'subscriptions:read', 'customers:read',
    'purchases:read', 'reports:read', 'reports:export', 'reports:manage',
  ],
  'hr-manager': [
    'dashboard:read', 'hr:read', 'hr:write', 'hr:manage', 'hr:payroll',
    'users:read', 'reports:read',
  ],
  'dietitian': [
    'dashboard:read', 'subscriptions:read', 'subscriptions:manage-plans',
    'customers:read', 'kitchen:read', 'production:read', 'reports:read',
  ],
  'customer-support': [
    'dashboard:read', 'customers:read', 'customers:write',
    'subscriptions:read', 'subscriptions:write',
    'orders:read', 'delivery:read', 'notifications:manage',
  ],
  'delivery-executive': [
    'delivery:read', 'delivery:write', 'orders:read',
  ],
  'customer': [
    'subscriptions:read', 'orders:read', 'delivery:read',
  ],
};

async function main() {
  console.log('🌱 Starting SuperBento ERP seed...\n');

  // ─── 1. Create Default Branch ─────────────────────────
  console.log('Creating default branch...');
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      name: 'SuperBento HQ — Chennai',
      code: 'HQ',
      address: '123 Anna Salai, T. Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600017',
      phone: '+914412345678',
      email: 'hq@superbento.com',
      isActive: true,
    },
  });
  console.log(`  ✓ Branch: ${branch.name}`);

  // ─── 2. Upsert Permissions ─────────────────────────────
  console.log('\nCreating permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions seeded`);

  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));

  // ─── 3. Upsert Roles ───────────────────────────────────
  console.log('\nCreating roles...');
  for (const roleData of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { slug: roleData.slug },
      update: { name: roleData.name, description: roleData.description },
      create: roleData,
    });
  }
  console.log(`  ✓ ${SYSTEM_ROLES.length} roles seeded`);

  const allRoles = await prisma.role.findMany();
  const roleMap = new Map(allRoles.map((r) => [r.slug, r.id]));

  // ─── 4. Assign Permissions to Roles ───────────────────
  console.log('\nAssigning permissions to roles...');

  // Super admin gets ALL permissions
  const superAdminId = roleMap.get('super-admin')!;
  await prisma.rolePermission.deleteMany({ where: { roleId: superAdminId } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: superAdminId, permissionId: p.id })),
    skipDuplicates: true,
  });
  console.log(`  ✓ super-admin: ${allPermissions.length} permissions`);

  // Other roles
  for (const [roleSlug, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleSlug);
    if (!roleId) continue;

    await prisma.rolePermission.deleteMany({ where: { roleId } });

    const permIds = permNames
      .map((name) => permissionMap.get(name))
      .filter(Boolean) as string[];

    if (permIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      });
    }
    console.log(`  ✓ ${roleSlug}: ${permIds.length} permissions`);
  }

  // ─── 5. Create Super Admin User ───────────────────────
  console.log('\nCreating Super Admin user...');
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'superadmin@superbento.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'SuperBento@2024!';
  const adminFirstName = process.env.SEED_ADMIN_FIRST_NAME || 'Super';
  const adminLastName = process.env.SEED_ADMIN_LAST_NAME || 'Admin';

  const passwordHash = await argon2.hash(adminPassword);
  const superAdminRoleId = roleMap.get('super-admin')!;

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, roleId: superAdminRoleId },
    create: {
      email: adminEmail,
      firstName: adminFirstName,
      lastName: adminLastName,
      passwordHash,
      roleId: superAdminRoleId,
      branchId: branch.id,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  console.log(`  ✓ Super Admin created: ${adminUser.email}`);
  console.log(`  ✓ Password: ${adminPassword}`);

  // ─── 6. Seed Sample Suppliers ─────────────────────────
  console.log('\nCreating sample suppliers...');
  const sampleSuppliers = [
    {
      name: 'AgroFresh Farms',
      contactPerson: 'Rajan Krishnamurthy',
      phone: '+919876543210',
      email: 'rajan@agrofresh.in',
      address: '14 Vegetable Market Road, Koyambedu, Chennai - 600092',
      gstin: '33ABCDE1234F1Z5',
      isActive: true,
    },
    {
      name: 'Chennai Masala Co.',
      contactPerson: 'Priya Sundaram',
      phone: '+919988776655',
      email: 'orders@chennaimasala.com',
      address: '78 Spice Bazaar Lane, Sowcarpet, Chennai - 600079',
      gstin: '33FGHIJ5678K2Z1',
      isActive: true,
    },
  ];
  // Use createMany to avoid duplicates on re-seed
  const existingSupplierCount = await prisma.supplier.count();
  if (existingSupplierCount === 0) {
    await prisma.supplier.createMany({ data: sampleSuppliers });
  }
  console.log(`  ✓ ${sampleSuppliers.length} sample suppliers seeded`);

  // ─── 7. Seed Employees & Employee Profiles ─────────────────
  console.log('\nCreating sample employees...');
  const kitchenStaffEmail = 'kitchenstaff@superbento.com';
  const driverEmail = 'driver@superbento.com';

  const kitchenStaffUser = await prisma.user.upsert({
    where: { email: kitchenStaffEmail },
    update: {},
    create: {
      email: kitchenStaffEmail,
      firstName: 'Ramesh',
      lastName: 'Kumar',
      passwordHash: passwordHash, // Share same seed password hash
      roleId: roleMap.get('kitchen-manager')!,
      branchId: branch.id,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: driverEmail },
    update: {},
    create: {
      email: driverEmail,
      firstName: 'Selvam',
      lastName: 'Muthu',
      passwordHash: passwordHash,
      roleId: roleMap.get('delivery-executive')!,
      branchId: branch.id,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  const employeeProfiles = [
    {
      userId: kitchenStaffUser.id,
      designation: 'Sous Chef',
      department: 'Kitchen',
      monthlySalary: 25000,
      joiningDate: new Date('2025-01-10'),
      bankName: 'State Bank of India',
      bankAccountNumber: '12345678901',
      ifscCode: 'SBIN0001234',
      isActive: true,
    },
    {
      userId: driverUser.id,
      designation: 'Delivery Rider',
      department: 'Delivery',
      monthlySalary: 18000,
      joiningDate: new Date('2025-03-15'),
      bankName: 'HDFC Bank',
      bankAccountNumber: '98765432109',
      ifscCode: 'HDFC0004321',
      isActive: true,
    },
  ];

  for (const emp of employeeProfiles) {
    await prisma.employeeProfile.upsert({
      where: { userId: emp.userId },
      update: {},
      create: emp,
    });
  }
  console.log('  ✓ Employee profiles seeded');

  // ─── 8. Seed South Indian Ingredients ─────────────────────
  console.log('\nSeeding South Indian ingredients...');
  const ingredientsData = [
    { name: 'Rava', unit: 'kg', defaultCost: 45 },
    { name: 'Coconut', unit: 'pcs', defaultCost: 25 },
    { name: 'Wheat Flour', unit: 'kg', defaultCost: 40 },
    { name: 'Potato', unit: 'kg', defaultCost: 30 },
    { name: 'Rice', unit: 'kg', defaultCost: 50 },
    { name: 'Toor Dal', unit: 'kg', defaultCost: 120 },
    { name: 'Chickpeas', unit: 'kg', defaultCost: 90 },
    { name: 'Raw Rice', unit: 'kg', defaultCost: 52 },
    { name: 'Moong Dal', unit: 'kg', defaultCost: 110 },
    { name: 'Ragi Flour', unit: 'kg', defaultCost: 48 },
    { name: 'Mixed Vegetables', unit: 'kg', defaultCost: 65 },
    { name: 'Butter Milk', unit: 'L', defaultCost: 35 },
    { name: 'Ivy Gourd (Kovakai)', unit: 'kg', defaultCost: 40 },
    { name: 'Turkey Berry (Sundaikai)', unit: 'kg', defaultCost: 80 },
    { name: 'Cabbage', unit: 'kg', defaultCost: 25 },
    { name: 'Basmati Rice', unit: 'kg', defaultCost: 110 },
    { name: 'Onion', unit: 'kg', defaultCost: 35 },
    { name: 'Cucumber', unit: 'kg', defaultCost: 30 },
    { name: 'Spinach (Keerai)', unit: 'kg', defaultCost: 20 },
    { name: 'Yam (Karunai kilangu)', unit: 'kg', defaultCost: 45 },
    { name: 'Chana Dal', unit: 'kg', defaultCost: 95 },
    { name: 'Bottle Gourd (Sorakai)', unit: 'kg', defaultCost: 28 },
    { name: 'Broad Beans (Avarai kai)', unit: 'kg', defaultCost: 55 },
    { name: 'Hakka Noodles', unit: 'kg', defaultCost: 70 },
    { name: 'Tomato', unit: 'kg', defaultCost: 32 },
    { name: 'Garlic', unit: 'kg', defaultCost: 180 },
    { name: 'Ginger', unit: 'kg', defaultCost: 120 },
    { name: 'Curd', unit: 'L', defaultCost: 60 },
    { name: 'Mustard Seeds', unit: 'kg', defaultCost: 220 },
    { name: 'Oil', unit: 'L', defaultCost: 140 },
    { name: 'Tamarind', unit: 'kg', defaultCost: 150 },
    { name: 'Sambar Powder', unit: 'kg', defaultCost: 350 },
    { name: 'Chana Masala Powder', unit: 'kg', defaultCost: 400 },
    { name: 'Biryani Masala', unit: 'kg', defaultCost: 450 },
    { name: 'Appalam', unit: 'pcs', defaultCost: 1.5 },
    { name: 'Ketchup', unit: 'kg', defaultCost: 120 },
    { name: 'Rava Kichidi Ready Mix', unit: 'kg', defaultCost: 90 },
    { name: 'Semiyah', unit: 'kg', defaultCost: 60 },
  ];

  const ingredientMap = new Map<string, string>();
  for (const ing of ingredientsData) {
    let dbIng = await prisma.ingredient.findFirst({
      where: { name: ing.name, deletedAt: null },
    });
    if (!dbIng) {
      dbIng = await prisma.ingredient.create({
        data: ing,
      });
    }
    ingredientMap.set(ing.name, dbIng.id);
  }
  console.log(`  ✓ ${ingredientsData.length} ingredients seeded`);

  // ─── 9. Seed Stock Levels in Inventory ───────────────────
  console.log('\nSeeding stock levels in inventory...');
  for (const ing of ingredientsData) {
    const ingId = ingredientMap.get(ing.name)!;
    await prisma.inventoryItem.upsert({
      where: {
        ingredientId_branchId: {
          ingredientId: ingId,
          branchId: branch.id,
        },
      },
      update: {
        currentStock: 150,
        minStockLevel: 15,
      },
      create: {
        ingredientId: ingId,
        branchId: branch.id,
        currentStock: 150,
        minStockLevel: 15,
        unit: ing.unit,
      },
    });
  }
  console.log('  ✓ Inventory items seeded with default stock level (150)');

  // ─── 10. Seed South Indian Recipes ───────────────────────
  console.log('\nSeeding South Indian Recipes...');
  const recipesData = [
    // Breakfast
    { name: 'Rava Kichidi', category: 'BREAKFAST', description: 'Semolina cooked with vegetables and spices', ingredients: [{ name: 'Rava', qty: 0.2, unit: 'kg' }, { name: 'Mixed Vegetables', qty: 0.1, unit: 'kg' }, { name: 'Oil', qty: 0.05, unit: 'L' }] },
    { name: 'Coconut Chutney', category: 'BREAKFAST', description: 'Freshly grated coconut chutney', ingredients: [{ name: 'Coconut', qty: 0.5, unit: 'pcs' }, { name: 'Onion', qty: 0.05, unit: 'kg' }] },
    { name: 'Poori', category: 'BREAKFAST', description: 'Deep fried puffed wheat flatbreads', ingredients: [{ name: 'Wheat Flour', qty: 0.15, unit: 'kg' }, { name: 'Oil', qty: 0.1, unit: 'L' }] },
    { name: 'Potato masala', category: 'BREAKFAST', description: 'Spiced mashed potato accompaniment', ingredients: [{ name: 'Potato', qty: 0.2, unit: 'kg' }, { name: 'Onion', qty: 0.1, unit: 'kg' }] },
    { name: 'Idly', category: 'BREAKFAST', description: 'Steamed savory rice cakes', ingredients: [{ name: 'Rice', qty: 0.1, unit: 'kg' }, { name: 'Chana Dal', qty: 0.02, unit: 'kg' }] },
    { name: 'Sambar', category: 'BREAKFAST', description: 'Lentil stew with tamarind and spices', ingredients: [{ name: 'Toor Dal', qty: 0.05, unit: 'kg' }, { name: 'Tomato', qty: 0.05, unit: 'kg' }, { name: 'Sambar Powder', qty: 0.01, unit: 'kg' }] },
    { name: 'Chapathi', category: 'BREAKFAST', description: 'Griddle cooked wheat flatbreads', ingredients: [{ name: 'Wheat Flour', qty: 0.12, unit: 'kg' }] },
    { name: 'Channa masala', category: 'BREAKFAST', description: 'Chickpeas cooked in spiced gravy', ingredients: [{ name: 'Chickpeas', qty: 0.1, unit: 'kg' }, { name: 'Tomato', qty: 0.08, unit: 'kg' }, { name: 'Chana Masala Powder', qty: 0.01, unit: 'kg' }] },
    { name: 'Pongal', category: 'BREAKFAST', description: 'Steamed rice and lentil mash with pepper and cumin', ingredients: [{ name: 'Raw Rice', qty: 0.1, unit: 'kg' }, { name: 'Moong Dal', qty: 0.05, unit: 'kg' }] },
    { name: 'Tiffin Sambar', category: 'BREAKFAST', description: 'Mild lentil stew served with breakfast items', ingredients: [{ name: 'Toor Dal', qty: 0.04, unit: 'kg' }, { name: 'Onion', qty: 0.05, unit: 'kg' }] },
    { name: 'Ragi Semiya Puttu', category: 'BREAKFAST', description: 'Steamed ragi vermicelli with coconut and sugar', ingredients: [{ name: 'Ragi Flour', qty: 0.1, unit: 'kg' }, { name: 'Coconut', qty: 0.2, unit: 'pcs' }] },
    { name: 'veg Kuruma', category: 'BREAKFAST', description: 'Mixed vegetables in a spiced coconut gravy', ingredients: [{ name: 'Mixed Vegetables', qty: 0.15, unit: 'kg' }, { name: 'Coconut', qty: 0.25, unit: 'pcs' }] },

    // Lunch
    { name: 'Milagai Killi Sambar', category: 'LUNCH', description: 'Tamarind lentil stew with sun-dried red chillies', ingredients: [{ name: 'Toor Dal', qty: 0.06, unit: 'kg' }, { name: 'Tomato', qty: 0.05, unit: 'kg' }] },
    { name: 'Rasam', category: 'LUNCH', description: 'Sour and spicy tomato-tamarind soup', ingredients: [{ name: 'Tamarind', qty: 0.02, unit: 'kg' }, { name: 'Tomato', qty: 0.06, unit: 'kg' }] },
    { name: 'Appalam', category: 'LUNCH', description: 'Deep fried lentil crackers', ingredients: [{ name: 'Appalam', qty: 2, unit: 'pcs' }, { name: 'Oil', qty: 0.05, unit: 'L' }] },
    { name: 'Moor Kuzhambu', category: 'LUNCH', description: 'Spiced buttermilk and ash gourd stew', ingredients: [{ name: 'Butter Milk', qty: 0.25, unit: 'L' }, { name: 'Coconut', qty: 0.2, unit: 'pcs' }] },
    { name: 'Kovakai', category: 'LUNCH', description: 'Stir-fried Ivy Gourd with spices', ingredients: [{ name: 'Ivy Gourd (Kovakai)', qty: 0.15, unit: 'kg' }] },
    { name: 'Sundaikai Kara Kuzhambu', category: 'LUNCH', description: 'Tangy and spicy turkey berry stew', ingredients: [{ name: 'Turkey Berry (Sundaikai)', qty: 0.08, unit: 'kg' }, { name: 'Tamarind', qty: 0.03, unit: 'kg' }] },
    { name: 'Cabbage Poriyal', category: 'LUNCH', description: 'Stir-fried cabbage with coconut tempering', ingredients: [{ name: 'Cabbage', qty: 0.18, unit: 'kg' }, { name: 'Coconut', qty: 0.1, unit: 'pcs' }] },
    { name: 'Veg biriyani', category: 'LUNCH', description: 'Fragrant basmati rice layered with vegetables and spices', ingredients: [{ name: 'Basmati Rice', qty: 0.15, unit: 'kg' }, { name: 'Mixed Vegetables', qty: 0.12, unit: 'kg' }, { name: 'Biryani Masala', qty: 0.01, unit: 'kg' }] },
    { name: 'Raitha', category: 'LUNCH', description: 'Cooling onion and cucumber yogurt side', ingredients: [{ name: 'Curd', qty: 0.1, unit: 'L' }, { name: 'Cucumber', qty: 0.05, unit: 'kg' }, { name: 'Onion', qty: 0.05, unit: 'kg' }] },
    { name: 'Keerai Kadayal', category: 'LUNCH', description: 'Mashed spinach with lentils and garlic', ingredients: [{ name: 'Spinach (Keerai)', qty: 0.2, unit: 'kg' }, { name: 'Garlic', qty: 0.01, unit: 'kg' }] },
    { name: 'Karunai kilangu', category: 'LUNCH', description: 'Yam masala roast with spices', ingredients: [{ name: 'Yam (Karunai kilangu)', qty: 0.2, unit: 'kg' }, { name: 'Oil', qty: 0.04, unit: 'L' }] },
    { name: 'Urundai Kuzhambu', category: 'LUNCH', description: 'Lentil dumplings simmered in tangy tamarind gravy', ingredients: [{ name: 'Chana Dal', qty: 0.05, unit: 'kg' }, { name: 'Tamarind', qty: 0.02, unit: 'kg' }] },
    { name: 'Sorakai Kootu', category: 'LUNCH', description: 'Bottle gourd and yellow lentil stew with coconut paste', ingredients: [{ name: 'Bottle Gourd (Sorakai)', qty: 0.2, unit: 'kg' }, { name: 'Moong Dal', qty: 0.04, unit: 'kg' }] },
    { name: 'Kadamba Sambar', category: 'LUNCH', description: 'Mixed vegetable sambar made with freshly ground spices', ingredients: [{ name: 'Toor Dal', qty: 0.05, unit: 'kg' }, { name: 'Mixed Vegetables', qty: 0.15, unit: 'kg' }] },
    { name: 'Avarai Kai', category: 'LUNCH', description: 'Broad beans poriyal with coconut', ingredients: [{ name: 'Broad Beans (Avarai kai)', qty: 0.15, unit: 'kg' }, { name: 'Coconut', qty: 0.1, unit: 'pcs' }] },

    // Dinner
    { name: 'Vadacurry', category: 'DINNER', description: 'Spiced lentil fritters simmered in a flavorful onion-tomato gravy', ingredients: [{ name: 'Chana Dal', qty: 0.08, unit: 'kg' }, { name: 'Onion', qty: 0.1, unit: 'kg' }] },
    { name: 'Noodles', category: 'DINNER', description: 'Stir fried hakka noodles with vegetables', ingredients: [{ name: 'Hakka Noodles', qty: 0.1, unit: 'kg' }, { name: 'Mixed Vegetables', qty: 0.08, unit: 'kg' }] },
    { name: 'Ketchup', category: 'DINNER', description: 'Sweet and tangy tomato sauce', ingredients: [{ name: 'Ketchup', qty: 0.02, unit: 'kg' }] },
    { name: 'dosa', category: 'DINNER', description: 'Crispy fermented rice and lentil crepe', ingredients: [{ name: 'Rice', qty: 0.1, unit: 'kg' }, { name: 'Oil', qty: 0.02, unit: 'L' }] },
    { name: 'Kara chutney', category: 'DINNER', description: 'Spicy onion tomato garlic chutney', ingredients: [{ name: 'Tomato', qty: 0.08, unit: 'kg' }, { name: 'Garlic', qty: 0.02, unit: 'kg' }] },
    { name: 'Veg Salna', category: 'DINNER', description: 'Popular street style watery vegetable gravy', ingredients: [{ name: 'Mixed Vegetables', qty: 0.12, unit: 'kg' }, { name: 'Coconut', qty: 0.2, unit: 'pcs' }] },
    { name: 'idiyappam', category: 'DINNER', description: 'Steamed string hoppers made of rice flour', ingredients: [{ name: 'Rice', qty: 0.1, unit: 'kg' }] },
  ];

  const recipeMap = new Map<string, string>();
  for (const rec of recipesData) {
    let dbRec = await prisma.recipe.findFirst({
      where: { name: rec.name, deletedAt: null },
    });
    if (!dbRec) {
      dbRec = await prisma.recipe.create({
        data: {
          name: rec.name,
          category: rec.category,
          description: rec.description,
          instructions: `Standard recipe instructions for preparing ${rec.name}.`,
          prepTimeMinutes: 15,
          cookTimeMinutes: 25,
        },
      });
    }

    // Link ingredients (clear first to prevent duplicates on re-seed)
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: dbRec.id },
    });

    for (const ingLink of rec.ingredients) {
      const ingId = ingredientMap.get(ingLink.name);
      if (ingId) {
        await prisma.recipeIngredient.create({
          data: {
            recipeId: dbRec.id,
            ingredientId: ingId,
            quantity: ingLink.qty,
            unit: ingLink.unit,
          },
        });
      }
    }

    recipeMap.set(rec.name, dbRec.id);
  }
  console.log(`  ✓ ${recipesData.length} recipes seeded and linked with ingredients`);

  // ─── 11. Seed Weekly Menu Board (Mon - Sun) ──────────────
  console.log('\nSeeding Weekly Menu Board (Mon - Sun)...');
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const daysMenuConfig = [
    {
      dayOffset: 0, // Monday
      meals: [
        { type: 'BREAKFAST' as const, recipes: ['Rava Kichidi', 'Coconut Chutney'] },
        { type: 'LUNCH' as const, recipes: ['Milagai Killi Sambar', 'Potato masala', 'Rasam', 'Appalam'] },
        { type: 'DINNER' as const, recipes: ['Idly', 'Vadacurry'] },
      ]
    },
    {
      dayOffset: 1, // Tuesday
      meals: [
        { type: 'BREAKFAST' as const, recipes: ['Poori', 'Potato masala'] },
        { type: 'LUNCH' as const, recipes: ['Moor Kuzhambu', 'Kovakai', 'Appalam'] },
        { type: 'DINNER' as const, recipes: ['Chapathi', 'Channa masala'] },
      ]
    },
    {
      dayOffset: 2, // Wednesday
      meals: [
        { type: 'BREAKFAST' as const, recipes: ['Idly', 'Sambar'] },
        { type: 'LUNCH' as const, recipes: ['Sundaikai Kara Kuzhambu', 'Cabbage Poriyal', 'Rasam', 'Appalam'] },
        { type: 'DINNER' as const, recipes: ['Noodles', 'Ketchup'] },
      ]
    },
    {
      dayOffset: 3, // Thursday
      meals: [
        { type: 'BREAKFAST' as const, recipes: ['Chapathi', 'Channa masala'] },
        { type: 'LUNCH' as const, recipes: ['Veg biriyani', 'Raitha'] },
        { type: 'DINNER' as const, recipes: ['dosa', 'Kara chutney'] },
      ]
    },
    {
      dayOffset: 4, // Friday
      meals: [
        { type: 'BREAKFAST' as const, recipes: ['Pongal', 'Tiffin Sambar'] },
        { type: 'LUNCH' as const, recipes: ['Keerai Kadayal', 'Karunai kilangu', 'Rasam', 'Appalam'] },
        { type: 'DINNER' as const, recipes: ['Chapathi', 'Veg Salna'] },
      ]
    },
    {
      dayOffset: 5, // Saturday
      meals: [
        { type: 'BREAKFAST' as const, recipes: ['Ragi Semiya Puttu'] },
        { type: 'LUNCH' as const, recipes: ['Urundai Kuzhambu', 'Sorakai Kootu', 'Rasam', 'Appalam'] },
        { type: 'DINNER' as const, recipes: ['Rava Kichidi', 'Coconut Chutney'] },
      ]
    },
    {
      dayOffset: 6, // Sunday
      meals: [
        { type: 'BREAKFAST' as const, recipes: ['Chapathi', 'veg Kuruma'] },
        { type: 'LUNCH' as const, recipes: ['Kadamba Sambar', 'Avarai Kai', 'Rasam', 'Appalam'] },
        { type: 'DINNER' as const, recipes: ['idiyappam', 'Vadacurry'] },
      ]
    }
  ];

  for (const dayConfig of daysMenuConfig) {
    const menuDate = new Date(monday);
    menuDate.setDate(monday.getDate() + dayConfig.dayOffset);

    let dailyMenu = await prisma.dailyMenu.findFirst({
      where: {
        date: menuDate,
        branchId: branch.id,
      },
    });

    if (!dailyMenu) {
      dailyMenu = await prisma.dailyMenu.create({
        data: {
          date: menuDate,
          branchId: branch.id,
          status: 'PUBLISHED',
        },
      });
    }

    await prisma.menuItem.deleteMany({
      where: { dailyMenuId: dailyMenu.id },
    });

    for (const meal of dayConfig.meals) {
      for (const recipeName of meal.recipes) {
        const recId = recipeMap.get(recipeName);
        if (recId) {
          await prisma.menuItem.create({
            data: {
              dailyMenuId: dailyMenu.id,
              recipeId: recId,
              mealType: meal.type,
              targetQuantity: 150,
            },
          });
        }
      }
    }
  }
  console.log('  ✓ Daily Menus (Mon - Sun) created and populated');

  // ─── 12. Seeding Transaction Ledger ───────────────────────
  console.log('\nSeeding transaction ledger...');
  const existingTxCount = await prisma.transaction.count();
  if (existingTxCount === 0) {
    const transactions = [
      {
        type: 'INCOME' as const,
        category: 'CUSTOMER_BILLING' as const,
        amount: 85000,
        notes: 'Monthly corporate lunch subscriptions',
        date: new Date('2026-07-05'),
        status: 'COMPLETED' as const,
      },
      {
        type: 'INCOME' as const,
        category: 'CUSTOMER_BILLING' as const,
        amount: 92000,
        notes: 'Individual retail meal subscriptions',
        date: new Date('2026-07-15'),
        status: 'COMPLETED' as const,
      },
      {
        type: 'EXPENSE' as const,
        category: 'RENT' as const,
        amount: 30000,
        notes: 'Central Kitchen rent - July',
        date: new Date('2026-07-01'),
        status: 'COMPLETED' as const,
      },
      {
        type: 'EXPENSE' as const,
        category: 'UTILITIES' as const,
        amount: 12500,
        notes: 'Electricity and gas connection bills',
        date: new Date('2026-07-03'),
        status: 'COMPLETED' as const,
      },
      {
        type: 'EXPENSE' as const,
        category: 'INGREDIENT_PURCHASE' as const,
        amount: 15400,
        notes: 'Weekly fresh vegetables purchase',
        date: new Date('2026-07-08'),
        status: 'COMPLETED' as const,
      },
      {
        type: 'EXPENSE' as const,
        category: 'INGREDIENT_PURCHASE' as const,
        amount: 22800,
        notes: 'Spices and grocery bulk buy',
        date: new Date('2026-07-12'),
        status: 'COMPLETED' as const,
      },
      {
        type: 'EXPENSE' as const,
        category: 'MARKETING' as const,
        amount: 8000,
        notes: 'Social media flyer promotion run',
        date: new Date('2026-07-18'),
        status: 'COMPLETED' as const,
      },
    ];

    await prisma.transaction.createMany({ data: transactions });
  }
  console.log('  ✓ Sample transactions seeded');

  // ─── 9. Summary ───────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════╗
║        🍱 SuperBento ERP Seed Complete        ║
╠══════════════════════════════════════════════╣
║  Branches    : 1                             ║
║  Roles       : ${String(SYSTEM_ROLES.length).padEnd(28)}║
║  Permissions : ${String(PERMISSIONS.length).padEnd(28)}║
║  Suppliers   : ${String(sampleSuppliers.length).padEnd(28)}║
║  Employees   : 2                             ║
║  Transactions: 7                             ║
║  Admin Email : ${adminEmail.padEnd(28)}║
╚══════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
