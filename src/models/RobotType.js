const mongoose = require('mongoose');

const RobotTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a robot type name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  manufacturer: {
    type: String,
    required: [true, 'Please add a manufacturer'],
    trim: true,
    maxlength: [100, 'Manufacturer cannot be more than 100 characters']
  },
  model: {
    type: String,
    required: [true, 'Please add a model'],
    trim: true,
    maxlength: [100, 'Model cannot be more than 100 characters']
  },
  image: {
    type: String,
    default: '/api/placeholder/200/150'
  },
  specifications: {
    height: String,
    weight: String,
    battery: String,
    sensors: String,
    operatingTemperature: String,
    connectivity: String,
    payload: String,
    speed: String
  },
  maintenanceItems: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
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
RobotTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
RobotTypeSchema.index({ name: 1 });
RobotTypeSchema.index({ manufacturer: 1 });
RobotTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('RobotType', RobotTypeSchema);

