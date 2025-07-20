// Database Seeding Script
// Creates initial users for the field maintenance application

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Robot = require('../src/models/Robot');
const logger = require('../src/utils/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed initial users
const seedUsers = async () => {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping user seeding');
      return;
    }

    const users = [
      {
        name: 'Admin User',
        email: 'admin@company.com',
        password: 'password123',
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
        password: 'password123',
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
        password: 'password123',
        role: 'technician',
        isActive: true,
        profile: {
          phone: '(555) 456-7890',
          department: 'Field Operations',
          certifications: ['ServiceBot Pro']
        }
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.email}`);
    }

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

// Seed initial customers
const seedCustomers = async () => {
  try {
    // Check if customers already exist
    const existingCustomers = await Customer.countDocuments();
    if (existingCustomers > 0) {
      console.log('Customers already exist, skipping customer seeding');
      return;
    }

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

    for (const customerData of customers) {
      const customer = new Customer(customerData);
      await customer.save();
      console.log(`Created customer: ${customer.name}`);
    }

    console.log('Customers seeded successfully');
  } catch (error) {
    console.error('Error seeding customers:', error);
  }
};

// Seed initial robots
const seedRobots = async () => {
  try {
    // Check if robots already exist
    const existingRobots = await Robot.countDocuments();
    if (existingRobots > 0) {
      console.log('Robots already exist, skipping robot seeding');
      return;
    }

    // Get customers to associate robots with
    const customers = await Customer.find();
    if (customers.length === 0) {
      console.log('No customers found, skipping robot seeding');
      return;
    }

    const robots = [
      {
        serialNumber: 'RBT-001',
        model: 'ServiceBot Pro',
        manufacturer: 'Ctrl Robotics',
        customerId: customers[0]._id, // Acme Corporation
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
        customerId: customers[0]._id, // Acme Corporation
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
        customerId: customers[1]._id, // Tech Solutions Inc
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
        customerId: customers[2]._id, // Global Industries
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

    for (const robotData of robots) {
      const robot = new Robot(robotData);
      await robot.save();
      console.log(`Created robot: ${robot.serialNumber}`);
    }

    console.log('Robots seeded successfully');
  } catch (error) {
    console.error('Error seeding robots:', error);
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('Starting database seeding...');
    
    await seedUsers();
    await seedCustomers();
    await seedRobots();
    
    console.log('Database seeding completed successfully!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
};

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

