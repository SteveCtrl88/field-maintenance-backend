const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader ID is required']
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['inspection', 'robot', 'customer', 'user'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  metadata: {
    dimensions: {
      width: Number,
      height: Number
    },
    compression: {
      quality: Number,
      originalSize: Number
    },
    location: {
      latitude: Number,
      longitude: Number
    },
    camera: {
      make: String,
      model: String,
      settings: {
        iso: Number,
        aperture: String,
        shutterSpeed: String,
        flash: Boolean
      }
    },
    checksum: String
  },
  storageLocation: {
    type: String,
    required: [true, 'Storage location is required']
  },
  url: {
    type: String,
    required: [true, 'File URL is required']
  },
  thumbnailUrl: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  description: {
    type: String,
    maxlength: 500
  },
  expiresAt: Date,
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAccessed: Date
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });
fileSchema.index({ mimeType: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
fileSchema.index({ tags: 1 });
fileSchema.index({ filename: 'text', originalName: 'text', description: 'text' });

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for file type category
fileSchema.virtual('category').get(function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  if (this.mimeType === 'application/pdf') return 'pdf';
  if (this.mimeType.includes('document') || this.mimeType.includes('text')) return 'document';
  return 'other';
});

// Virtual for human-readable file size
fileSchema.virtual('humanSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to increment download count
fileSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Method to add tag
fileSchema.methods.addTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  if (!this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove tag
fileSchema.methods.removeTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== normalizedTag);
  return this.save();
};

// Method to update metadata
fileSchema.methods.updateMetadata = function(metadata) {
  this.metadata = { ...this.metadata, ...metadata };
  return this.save();
};

// Static method to get files by type
fileSchema.statics.getByType = function(type, relatedId, options = {}) {
  const query = {
    'relatedTo.type': type,
    'relatedTo.id': relatedId
  };
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 50)
    .populate('uploadedBy', 'name email');
};

// Static method to get file statistics
fileSchema.statics.getStatistics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' },
        averageSize: { $avg: '$size' }
      }
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: '$count' },
        totalSize: { $sum: '$totalSize' },
        categories: {
          $push: {
            category: '$_id',
            count: '$count',
            totalSize: '$totalSize',
            averageSize: '$averageSize'
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to cleanup expired files
fileSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('File', fileSchema);

