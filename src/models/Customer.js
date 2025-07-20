const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: 200
  },
  contactInfo: {
    primaryContact: {
      type: String,
      required: [true, 'Primary contact is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required']
      },
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      zipCode: {
        type: String,
        required: [true, 'Zip code is required']
      },
      country: {
        type: String,
        default: 'United States'
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  serviceAgreement: {
    type: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    startDate: {
      type: Date,
      required: [true, 'Service start date is required']
    },
    endDate: Date,
    maintenanceFrequency: {
      type: Number,
      default: 90, // days
      min: 1
    }
  },
  robots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Robot'
  }],
  assignedTechnicians: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ companyName: 1 });
customerSchema.index({ 'contactInfo.email': 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ 'contactInfo.address.coordinates': '2dsphere' });
customerSchema.index({ companyName: 'text', 'contactInfo.primaryContact': 'text' });

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
  const addr = this.contactInfo.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
});

// Virtual for robot count
customerSchema.virtual('robotCount').get(function() {
  return this.robots.length;
});

// Method to add robot
customerSchema.methods.addRobot = function(robotId) {
  if (!this.robots.includes(robotId)) {
    this.robots.push(robotId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove robot
customerSchema.methods.removeRobot = function(robotId) {
  this.robots = this.robots.filter(id => !id.equals(robotId));
  return this.save();
};

// Method to assign technician
customerSchema.methods.assignTechnician = function(technicianId) {
  if (!this.assignedTechnicians.includes(technicianId)) {
    this.assignedTechnicians.push(technicianId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to unassign technician
customerSchema.methods.unassignTechnician = function(technicianId) {
  this.assignedTechnicians = this.assignedTechnicians.filter(id => !id.equals(technicianId));
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);

