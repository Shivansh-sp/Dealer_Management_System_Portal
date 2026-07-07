import { User } from '../models/User';
import { Role } from '../models/Role';
import { Document as DbDocument } from '../models/Document';
import { UserRole, RolePermissions } from '../constants/roles';
import { logger } from '../config/logger';
import fs from 'fs';
import path from 'path';

const seedDocuments = async () => {
  try {
    const adminUser = await User.findOne({ role: UserRole.MASTER_ADMIN });
    if (!adminUser) {
      logger.warn('Master Admin user not found. Skipping document seeding.');
      return;
    }

    const projectRootDir = path.join(__dirname, '../../..');
    const srcDocsDir = path.join(projectRootDir, 'documents');
    const destUploadsDir = path.join(projectRootDir, 'backend', 'uploads');

    // Ensure uploads directory exists
    if (!fs.existsSync(destUploadsDir)) {
      fs.mkdirSync(destUploadsDir, { recursive: true });
    }

    // Check if srcDocsDir exists
    if (!fs.existsSync(srcDocsDir)) {
      logger.warn(`Source documents directory not found at: ${srcDocsDir}`);
      return;
    }

    const files = fs.readdirSync(srcDocsDir);
    logger.info(`Found ${files.length} documents to copy: ${files.join(', ')}`);

    // Document mapping: filename -> { name, type }
    const docMapping: Record<string, { name: string; type: string }> = {
      'FAILED TAG PART (CRM) - Copy.pdf': {
        name: 'Failed Part Tag (CRM) Template',
        type: 'Failed Part Tag',
      },
      'Gate Pass Format.pdf': {
        name: 'Gate Pass Format Template',
        type: 'Gate Pass',
      },
      'Material Reciept Sheet.pdf': {
        name: 'Material Receipt Sheet Template',
        type: 'Material Receipt Sheet',
      },
      'PDI INSPECTION SHEET.pdf': {
        name: 'PDI Inspection Sheet Template',
        type: 'PDI Inspection Sheet',
      },
      'PURCHASE ORDER Format.pdf': {
        name: 'Purchase Order Format Template',
        type: 'Purchase Order',
      },
      'Service Schedule ,Labor Cost ,Part Replacement Sheet.pdf': {
        name: 'Service Schedule, Labor Cost & Part Replacement Sheet',
        type: 'Service Schedule',
      },
      'WARRANTY CLAIM FORM(CRM) - Copy.pdf': {
        name: 'Warranty Claim Form (CRM) Template',
        type: 'Warranty Claim Form',
      },
      'WARRANTY PART PICK UP (CRM) - Copy.pdf': {
        name: 'Warranty Part Pick Up (CRM) Template',
        type: 'Warranty Pickup Sheet',
      },
    };

    for (const filename of files) {
      const srcPath = path.join(srcDocsDir, filename);
      const destPath = path.join(destUploadsDir, filename);

      try {
        // Copy physical file
        fs.copyFileSync(srcPath, destPath);
        logger.info(`Copied ${filename} to backend/uploads`);

        // Seed database Document entry if it doesn't exist
        const mapping = docMapping[filename];
        if (mapping) {
          const fileUrl = `/uploads/${filename}`;
          const existingDoc = await DbDocument.findOne({ fileUrl });

          if (!existingDoc) {
            const documentId = `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
            await DbDocument.create({
              documentId,
              name: mapping.name,
              documentType: mapping.type,
              fileUrl,
              uploadedBy: adminUser._id,
            });
            logger.info(`Database entry created for document: ${mapping.name}`);
          }
        }
      } catch (error) {
        logger.error(`Error copying/seeding document ${filename}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error seeding documents:', error);
  }
};

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

    // 3. Seed Documents
    await seedDocuments();
  } catch (err) {
    logger.error('Error seeding database:', err);
  }
};
