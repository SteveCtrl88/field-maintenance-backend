const mongoose = require('mongoose');

const InspectionSchema = new mongoose.Schema({
  robotSerial: {
    type: String,
    required: [true, 'Please add a robot serial number'],
    trim: true
  },
  customer: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true
  },
  technician: {
    type: String,
    required: [true, 'Please add a technician name'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add an inspection date']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  maintenanceItems: [{
    item: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  notes: {
    type: String,
    default: ''
  },
  images: [{
    type: String // URLs to uploaded images
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
InspectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
InspectionSchema.index({ robotSerial: 1 });
InspectionSchema.index({ customer: 1 });
InspectionSchema.index({ date: -1 });
InspectionSchema.index({ status: 1 });

module.exports = mongoose.model('Inspection', InspectionSchema);

