import cron from 'node-cron';
import { logger } from '../config/logger';
import { Inventory } from '../models/Inventory';
import { Booking } from '../models/Booking';

export const initCronJobs = () => {
  // 1. Daily service reminders (every day at 9:00 AM)
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('Running Daily Service Reminders Cron...');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayEnd = new Date(tomorrow);
      dayEnd.setHours(23, 59, 59, 999);

      // Find bookings scheduled for tomorrow
      const upcomingServices = await Booking.find({
        bookingType: 'Service',
        scheduledDate: { $gte: tomorrow, $lte: dayEnd },
        status: 'Scheduled',
      }).populate('customerId');

      logger.info(`Sent ${upcomingServices.length} service reminders via SMS/Email simulation.`);
    } catch (err) {
      logger.error('Error in Service Reminders Cron:', err);
    }
  });

  // 2. Low Stock Alerts (every 4 hours)
  cron.schedule('0 */4 * * *', async () => {
    try {
      logger.info('Running Low Stock Alert Check...');
      const lowStockItems = await Inventory.find({
        isDeleted: false,
        $expr: { $lte: ['$stockLevel', '$minStockLevel'] },
      });

      if (lowStockItems.length > 0) {
        logger.warn(`Low stock warning! ${lowStockItems.length} items require replenishment.`);
        lowStockItems.forEach((item) => {
          logger.warn(`Item: ${item.name} (${item.sku}) | Stock: ${item.stockLevel} | Min Required: ${item.minStockLevel}`);
        });
      }
    } catch (err) {
      logger.error('Error in Low Stock Cron:', err);
    }
  });

  logger.info('Cron background jobs initialized.');
};
