const mongoose = require('mongoose');

const checkItemSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pass', 'fail', 'na'],
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  photos: [{
    type: String // File URLs or paths
  }]
}, { _id: false });

const doorTestSchema = new mongoose.Schema({
  doorNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  isWorking: {
    type: Boolean,
    required: true
  },
  needsAttention: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 500
  },
  photos: [{
    type: String
  }]
}, { _id: false });

const inspectionSchema = new mongoose.Schema({
  robotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Robot',
    required: [true, 'Robot ID is required']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Technician ID is required']
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  checklist: {
    displayCheck: checkItemSchema,
    chargingCheck: checkItemSchema,
    chargerCheck: checkItemSchema,
    damageAssessment: {
      hasDamage: {
        type: Boolean,
        required: true,
        default: false
      },
      description: {
        type: String,
        maxlength: 1000
      },
      photos: [{
        type: String
      }]
    },
    hardwareTests: {
      door1: doorTestSchema,
      door2: doorTestSchema,
      door3: doorTestSchema,
      door4: doorTestSchema
    }
  },
  overallStatus: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    required: function() {
      return this.status === 'completed';
    }
  },
  issuesFound: {
    type: Number,
    default: 0,
    min: 0
  },
  photosCount: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    min: 0
  },
  nextMaintenanceDate: Date,
  signature: {
    type: String // base64 encoded signature
  },
  summary: {
    type: String,
    maxlength: 1000
  },
  recommendations: [{
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    estimatedCost: Number,
    targetDate: Date
  }],
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }]
}, {
  timestamps: true
});

// Indexes
inspectionSchema.index({ robotId: 1 });
inspectionSchema.index({ customerId: 1 });
inspectionSchema.index({ technicianId: 1 });
inspectionSchema.index({ startTime: 1 });
inspectionSchema.index({ status: 1 });
inspectionSchema.index({ robotId: 1, status: 1 });
inspectionSchema.index({ customerId: 1, startTime: -1 });
inspectionSchema.index({ technicianId: 1, startTime: -1 });

// Virtual for inspection duration in minutes
inspectionSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return null;
});

// Virtual for total photos count
inspectionSchema.virtual('totalPhotos').get(function() {
  let count = 0;
  
  if (this.checklist.displayCheck?.photos) count += this.checklist.displayCheck.photos.length;
  if (this.checklist.chargingCheck?.photos) count += this.checklist.chargingCheck.photos.length;
  if (this.checklist.chargerCheck?.photos) count += this.checklist.chargerCheck.photos.length;
  if (this.checklist.damageAssessment?.photos) count += this.checklist.damageAssessment.photos.length;
  
  // Count door test photos
  ['door1', 'door2', 'door3', 'door4'].forEach(door => {
    if (this.checklist.hardwareTests?.[door]?.photos) {
      count += this.checklist.hardwareTests[door].photos.length;
    }
  });
  
  return count;
});

// Pre-save middleware to calculate duration and photo count
inspectionSchema.pre('save', function(next) {
  // Calculate duration if inspection is completed
  if (this.status === 'completed' && this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  // Update photos count
  this.photosCount = this.totalPhotos;
  
  // Calculate issues found
  let issues = 0;
  
  if (this.checklist.displayCheck?.status === 'fail') issues++;
  if (this.checklist.chargingCheck?.status === 'fail') issues++;
  if (this.checklist.chargerCheck?.status === 'fail') issues++;
  if (this.checklist.damageAssessment?.hasDamage) issues++;
  
  // Count door issues
  ['door1', 'door2', 'door3', 'door4'].forEach(door => {
    if (this.checklist.hardwareTests?.[door] && !this.checklist.hardwareTests[door].isWorking) {
      issues++;
    }
  });
  
  this.issuesFound = issues;
  
  // Determine overall status based on issues
  if (this.status === 'completed' && !this.overallStatus) {
    if (issues === 0) this.overallStatus = 'excellent';
    else if (issues <= 2) this.overallStatus = 'good';
    else if (issues <= 4) this.overallStatus = 'fair';
    else this.overallStatus = 'poor';
  }
  
  next();
});

// Method to complete inspection
inspectionSchema.methods.complete = function(signature, summary) {
  this.status = 'completed';
  this.endTime = new Date();
  if (signature) this.signature = signature;
  if (summary) this.summary = summary;
  
  // Set next maintenance date (90 days from now by default)
  this.nextMaintenanceDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  
  return this.save();
};

// Method to cancel inspection
inspectionSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.endTime = new Date();
  if (reason) this.summary = `Cancelled: ${reason}`;
  
  return this.save();
};

// Method to add photo to checklist item
inspectionSchema.methods.addPhoto = function(checklistItem, photoUrl) {
  const parts = checklistItem.split('.');
  let target = this.checklist;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!target[parts[i]]) target[parts[i]] = {};
    target = target[parts[i]];
  }
  
  const lastPart = parts[parts.length - 1];
  if (!target[lastPart]) target[lastPart] = {};
  if (!target[lastPart].photos) target[lastPart].photos = [];
  
  target[lastPart].photos.push(photoUrl);
  
  return this.save();
};

// Method to add recommendation
inspectionSchema.methods.addRecommendation = function(priority, description, estimatedCost, targetDate) {
  this.recommendations.push({
    priority,
    description,
    estimatedCost,
    targetDate
  });
  
  return this.save();
};

// Static method to get inspection statistics
inspectionSchema.statics.getStatistics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalInspections: { $sum: 1 },
        completedInspections: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressInspections: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        averageDuration: { $avg: '$duration' },
        totalIssues: { $sum: '$issuesFound' },
        averageIssues: { $avg: '$issuesFound' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Inspection', inspectionSchema);

