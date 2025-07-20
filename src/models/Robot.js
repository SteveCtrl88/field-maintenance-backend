const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
    default: 'Ctrl Robotics'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  specifications: {
    type: {
      type: String,
      enum: ['delivery', 'cleaning', 'security', 'inspection'],
      default: 'delivery'
    },
    version: {
      type: String,
      trim: true
    },
    installationDate: {
      type: Date,
      required: [true, 'Installation date is required']
    },
    warrantyExpiration: Date,
    technicalSpecs: {
      dimensions: {
        height: Number,
        width: Number,
        depth: Number,
        weight: Number
      },
      battery: {
        type: String,
        capacity: Number,
        chargingTime: Number
      },
      sensors: [String],
      connectivity: [String],
      operatingTemperature: {
        min: Number,
        max: Number
      }
    }
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'retired', 'offline'],
    default: 'active'
  },
  lastMaintenanceDate: Date,
  nextMaintenanceDate: {
    type: Date,
    required: true
  },
  maintenanceHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inspection'
  }],
  location: {
    building: String,
    floor: String,
    zone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  operationalHours: {
    type: Number,
    default: 0,
    min: 0
  },
  alerts: [{
    type: {
      type: String,
      enum: ['maintenance_due', 'battery_low', 'error', 'offline']
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Indexes
robotSchema.index({ serialNumber: 1 });
robotSchema.index({ qrCode: 1 });
robotSchema.index({ customerId: 1 });
robotSchema.index({ status: 1 });
robotSchema.index({ nextMaintenanceDate: 1 });
robotSchema.index({ customerId: 1, status: 1 });
robotSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for maintenance status
robotSchema.virtual('maintenanceStatus').get(function() {
  if (!this.nextMaintenanceDate) return 'unknown';
  
  const now = new Date();
  const daysUntilMaintenance = Math.ceil((this.nextMaintenanceDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilMaintenance < 0) return 'overdue';
  if (daysUntilMaintenance === 0) return 'due_today';
  if (daysUntilMaintenance <= 7) return 'due_soon';
  return 'scheduled';
});

// Virtual for days until maintenance
robotSchema.virtual('daysUntilMaintenance').get(function() {
  if (!this.nextMaintenanceDate) return null;
  
  const now = new Date();
  return Math.ceil((this.nextMaintenanceDate - now) / (1000 * 60 * 60 * 24));
});

// Method to add inspection to history
robotSchema.methods.addInspection = function(inspectionId) {
  this.maintenanceHistory.push(inspectionId);
  this.lastMaintenanceDate = new Date();
  
  // Calculate next maintenance date based on customer's maintenance frequency
  return this.populate('customerId').then(() => {
    if (this.customerId && this.customerId.serviceAgreement) {
      const frequency = this.customerId.serviceAgreement.maintenanceFrequency || 90;
      this.nextMaintenanceDate = new Date(Date.now() + frequency * 24 * 60 * 60 * 1000);
    }
    return this.save();
  });
};

// Method to update status
robotSchema.methods.updateStatus = function(newStatus, reason) {
  this.status = newStatus;
  
  if (reason) {
    this.alerts.push({
      type: 'status_change',
      message: `Status changed to ${newStatus}: ${reason}`,
      severity: newStatus === 'offline' ? 'high' : 'medium'
    });
  }
  
  return this.save();
};

// Method to add alert
robotSchema.methods.addAlert = function(type, message, severity = 'medium') {
  this.alerts.push({
    type,
    message,
    severity
  });
  
  // Keep only last 50 alerts
  if (this.alerts.length > 50) {
    this.alerts = this.alerts.slice(-50);
  }
  
  return this.save();
};

// Method to acknowledge alert
robotSchema.methods.acknowledgeAlert = function(alertId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.acknowledged = true;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to generate QR code
robotSchema.methods.generateQRCode = function() {
  if (!this.qrCode) {
    this.qrCode = `CTRL-${this.serialNumber}-${Date.now()}`;
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Robot', robotSchema);

