import { User } from '../models/User';
import { Role } from '../models/Role';
import { UserRole, RolePermissions } from '../constants/roles';
import { logger } from '../config/logger';

export const seedDatabase = async () => {
  try {
    // 1. Seed Roles & Permissions
    const roleCount = await Role.countDocuments();
    if (roleCount === 0) {
      logger.info('No roles found. Seeding default roles and permissions...');
      for (const roleName of Object.values(UserRole)) {
        await Role.create({
          name: roleName,
          permissions: RolePermissions[roleName],
        });
      }
      logger.info('Roles and permissions seeded.');
    }

    // 2. Seed Default Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('No users found. Seeding default user accounts for each role...');

      // Seed one account per role
      const roles = Object.values(UserRole);
      for (const roleName of roles) {
        const roleSlug = roleName.toLowerCase().replace(/\s+/g, '');
        const userId = roleSlug;
        const name = `${roleName} User`;
        const email = `${roleSlug}@smg.com`;
        const password = 'password123'; // Standard default password
        const phoneNumber = '9876543210';

        await User.create({
          userId,
          name,
          email,
          password,
          role: roleName,
          phoneNumber,
        });

        logger.info(`Seeded account: ID: ${userId} | Password: ${password} | Role: ${roleName}`);
      }
      logger.info('Default user accounts seeding completed.');
    }
  } catch (err) {
    logger.error('Error seeding database:', err);
  }
};
