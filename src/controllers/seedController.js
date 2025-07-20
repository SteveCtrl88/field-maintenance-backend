const User = require('../models/User');
const Customer = require('../models/Customer');
const Robot = require('../models/Robot');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Initialize database with demo data
// @route   POST /api/seed/init
// @access  Public (for initial setup only)
const initializeDatabase = asyncHandler(async (req, res) => {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(200).json({
        success: true,
        message: 'Database already initialized',
        data: {
          usersCount: existingUsers
        }
      });
    }

    // Create initial users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@company.com',
        passwordHash: 'password123', // Will be hashed by pre-save hook
        role: 'admin',
        isActive: true,
        profile: {
          phone: '(555) 123-4567',
          department: 'Administration'
        }
      },
      {
        name: 'Tech User',
        email: 'tech@company.com',
        passwordHash: 'password123', // Will be hashed by pre-save hook
        role: 'technician',
        isActive: true,
        profile: {
          phone: '(555) 987-6543',
          department: 'Field Operations',
          certifications: ['ServiceBot Pro', 'ServiceBot Elite']
        }
      },
      {
        name: 'John Smith',
        email: 'john.smith@company.com',
        passwordHash: 'password123', // Will be hashed by pre-save hook
        role: 'technician',
        isActive: true,
        profile: {
          phone: '(555) 456-7890',
          department: 'Field Operations',
          certifications: ['ServiceBot Pro']
        }
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
      logger.info('Created user during initialization', { email: user.email, role: user.role });
    }

    // Create initial customers
    const customers = [
      {
        name: 'Acme Corporation',
        address: {
          street: '123 Business Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contact: {
          name: 'John Doe',
          email: 'john.doe@acme.com',
          phone: '(555) 123-4567'
        },
        serviceAgreement: {
          type: 'premium',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          maintenanceFrequency: 'monthly'
        },
        isActive: true
      },
      {
        name: 'Tech Solutions Inc',
        address: {
          street: '456 Innovation Dr',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        contact: {
          name: 'Jane Smith',
          email: 'jane.smith@techsolutions.com',
          phone: '(555) 987-6543'
        },
        serviceAgreement: {
          type: 'standard',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          maintenanceFrequency: 'quarterly'
        },
        isActive: true
      },
      {
        name: 'Global Industries',
        address: {
          street: '789 Corporate Blvd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        contact: {
          name: 'Bob Wilson',
          email: 'bob.wilson@globalind.com',
          phone: '(555) 456-7890'
        },
        serviceAgreement: {
          type: 'basic',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          maintenanceFrequency: 'biannual'
        },
        isActive: true
      }
    ];

    const createdCustomers = [];
    for (const customerData of customers) {
      const customer = new Customer(customerData);
      await customer.save();
      createdCustomers.push({
        id: customer._id,
        name: customer.name,
        address: customer.address
      });
      logger.info('Created customer during initialization', { name: customer.name });
    }

    // Create initial robots
    const robots = [
      {
        serialNumber: 'RBT-001',
        model: 'ServiceBot Pro',
        manufacturer: 'Ctrl Robotics',
        customerId: createdCustomers[0].id, // Acme Corporation
        specifications: {
          version: '2.1',
          batteryCapacity: '5000mAh',
          maxSpeed: '2.5 m/s',
          payload: '10kg'
        },
        status: 'active',
        location: {
          building: 'Main Office',
          floor: '1st Floor',
          zone: 'Reception'
        },
        installationDate: new Date('2024-06-01'),
        warrantyExpiration: new Date('2026-06-01')
      },
      {
        serialNumber: 'RBT-002',
        model: 'ServiceBot Pro',
        manufacturer: 'Ctrl Robotics',
        customerId: createdCustomers[0].id, // Acme Corporation
        specifications: {
          version: '2.1',
          batteryCapacity: '5000mAh',
          maxSpeed: '2.5 m/s',
          payload: '10kg'
        },
        status: 'maintenance',
        location: {
          building: 'Main Office',
          floor: '2nd Floor',
          zone: 'Conference Room'
        },
        installationDate: new Date('2024-07-15'),
        warrantyExpiration: new Date('2026-07-15')
      },
      {
        serialNumber: 'RBT-045',
        model: 'ServiceBot Elite',
        manufacturer: 'Ctrl Robotics',
        customerId: createdCustomers[1].id, // Tech Solutions Inc
        specifications: {
          version: '3.0',
          batteryCapacity: '7500mAh',
          maxSpeed: '3.0 m/s',
          payload: '15kg'
        },
        status: 'active',
        location: {
          building: 'Tech Center',
          floor: '3rd Floor',
          zone: 'Lab Area'
        },
        installationDate: new Date('2024-08-01'),
        warrantyExpiration: new Date('2026-08-01')
      },
      {
        serialNumber: 'RBT-023',
        model: 'ServiceBot Standard',
        manufacturer: 'Ctrl Robotics',
        customerId: createdCustomers[2].id, // Global Industries
        specifications: {
          version: '1.5',
          batteryCapacity: '4000mAh',
          maxSpeed: '2.0 m/s',
          payload: '8kg'
        },
        status: 'active',
        location: {
          building: 'Warehouse',
          floor: 'Ground Floor',
          zone: 'Storage Area'
        },
        installationDate: new Date('2024-05-15'),
        warrantyExpiration: new Date('2026-05-15')
      }
    ];

    const createdRobots = [];
    for (const robotData of robots) {
      const robot = new Robot(robotData);
      await robot.save();
      createdRobots.push({
        id: robot._id,
        serialNumber: robot.serialNumber,
        model: robot.model,
        status: robot.status
      });
      logger.info('Created robot during initialization', { serialNumber: robot.serialNumber });
    }

    logger.info('Database initialization completed successfully', {
      usersCreated: createdUsers.length,
      customersCreated: createdCustomers.length,
      robotsCreated: createdRobots.length
    });

    res.status(201).json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        users: createdUsers,
        customers: createdCustomers,
        robots: createdRobots,
        summary: {
          usersCreated: createdUsers.length,
          customersCreated: createdCustomers.length,
          robotsCreated: createdRobots.length
        }
      }
    });

  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw new AppError('Database initialization failed', 500, 'INITIALIZATION_ERROR');
  }
});

// @desc    Get database status
// @route   GET /api/seed/status
// @access  Public
const getDatabaseStatus = asyncHandler(async (req, res) => {
  try {
    const [usersCount, customersCount, robotsCount] = await Promise.all([
      User.countDocuments(),
      Customer.countDocuments(),
      Robot.countDocuments()
    ]);

    const isInitialized = usersCount > 0;

    res.status(200).json({
      success: true,
      message: 'Database status retrieved',
      data: {
        isInitialized,
        counts: {
          users: usersCount,
          customers: customersCount,
          robots: robotsCount
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get database status', { error: error.message });
    throw new AppError('Failed to get database status', 500, 'STATUS_ERROR');
  }
});

module.exports = {
  initializeDatabase,
  getDatabaseStatus
};

