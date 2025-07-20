const Joi = require('joi');
const logger = require('../utils/logger');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      logger.warn('Validation error:', { errors, path: req.path });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // User schemas
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  userCreate: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().trim().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'technician').default('technician'),
    profile: Joi.object({
      phone: Joi.string().trim(),
      address: Joi.object({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zipCode: Joi.string(),
        country: Joi.string()
      })
    })
  }),

  userUpdate: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    role: Joi.string().valid('admin', 'technician'),
    isActive: Joi.boolean(),
    profile: Joi.object({
      phone: Joi.string().trim(),
      address: Joi.object({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zipCode: Joi.string(),
        country: Joi.string()
      })
    })
  }),

  // Customer schemas
  customerCreate: Joi.object({
    companyName: Joi.string().trim().max(200).required(),
    contactInfo: Joi.object({
      primaryContact: Joi.string().trim().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().trim().required(),
      address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().default('United States')
      }).required()
    }).required(),
    serviceAgreement: Joi.object({
      type: Joi.string().valid('basic', 'premium', 'enterprise').default('basic'),
      startDate: Joi.date().required(),
      endDate: Joi.date(),
      maintenanceFrequency: Joi.number().min(1).default(90)
    }),
    assignedTechnicians: Joi.array().items(Joi.string().hex().length(24)),
    notes: Joi.string().max(1000)
  }),

  customerUpdate: Joi.object({
    companyName: Joi.string().trim().max(200),
    contactInfo: Joi.object({
      primaryContact: Joi.string().trim(),
      email: Joi.string().email(),
      phone: Joi.string().trim(),
      address: Joi.object({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zipCode: Joi.string(),
        country: Joi.string()
      })
    }),
    serviceAgreement: Joi.object({
      type: Joi.string().valid('basic', 'premium', 'enterprise'),
      startDate: Joi.date(),
      endDate: Joi.date(),
      maintenanceFrequency: Joi.number().min(1)
    }),
    assignedTechnicians: Joi.array().items(Joi.string().hex().length(24)),
    isActive: Joi.boolean(),
    notes: Joi.string().max(1000)
  }),

  // Robot schemas
  robotCreate: Joi.object({
    serialNumber: Joi.string().trim().uppercase().required(),
    model: Joi.string().trim().required(),
    manufacturer: Joi.string().trim().default('Ctrl Robotics'),
    customerId: Joi.string().hex().length(24).required(),
    specifications: Joi.object({
      type: Joi.string().valid('delivery', 'cleaning', 'security', 'inspection').default('delivery'),
      version: Joi.string().trim(),
      installationDate: Joi.date().required(),
      warrantyExpiration: Joi.date(),
      technicalSpecs: Joi.object()
    }),
    qrCode: Joi.string().trim(),
    location: Joi.object({
      building: Joi.string(),
      floor: Joi.string(),
      zone: Joi.string()
    })
  }),

  robotUpdate: Joi.object({
    model: Joi.string().trim(),
    manufacturer: Joi.string().trim(),
    specifications: Joi.object({
      type: Joi.string().valid('delivery', 'cleaning', 'security', 'inspection'),
      version: Joi.string().trim(),
      installationDate: Joi.date(),
      warrantyExpiration: Joi.date(),
      technicalSpecs: Joi.object()
    }),
    status: Joi.string().valid('active', 'maintenance', 'retired', 'offline'),
    location: Joi.object({
      building: Joi.string(),
      floor: Joi.string(),
      zone: Joi.string()
    }),
    operationalHours: Joi.number().min(0)
  }),

  // Inspection schemas
  inspectionCreate: Joi.object({
    robotId: Joi.string().hex().length(24).required(),
    customerId: Joi.string().hex().length(24).required()
  }),

  inspectionUpdate: Joi.object({
    checklist: Joi.object({
      displayCheck: Joi.object({
        status: Joi.string().valid('pass', 'fail', 'na').required(),
        notes: Joi.string().max(500),
        photos: Joi.array().items(Joi.string())
      }),
      chargingCheck: Joi.object({
        status: Joi.string().valid('pass', 'fail', 'na').required(),
        notes: Joi.string().max(500),
        photos: Joi.array().items(Joi.string())
      }),
      chargerCheck: Joi.object({
        status: Joi.string().valid('pass', 'fail', 'na').required(),
        notes: Joi.string().max(500),
        photos: Joi.array().items(Joi.string())
      }),
      damageAssessment: Joi.object({
        hasDamage: Joi.boolean().required(),
        description: Joi.string().max(1000),
        photos: Joi.array().items(Joi.string())
      }),
      hardwareTests: Joi.object({
        door1: Joi.object({
          doorNumber: Joi.number().valid(1).default(1),
          isWorking: Joi.boolean().required(),
          needsAttention: Joi.boolean().default(false),
          notes: Joi.string().max(500),
          photos: Joi.array().items(Joi.string())
        }),
        door2: Joi.object({
          doorNumber: Joi.number().valid(2).default(2),
          isWorking: Joi.boolean().required(),
          needsAttention: Joi.boolean().default(false),
          notes: Joi.string().max(500),
          photos: Joi.array().items(Joi.string())
        }),
        door3: Joi.object({
          doorNumber: Joi.number().valid(3).default(3),
          isWorking: Joi.boolean().required(),
          needsAttention: Joi.boolean().default(false),
          notes: Joi.string().max(500),
          photos: Joi.array().items(Joi.string())
        }),
        door4: Joi.object({
          doorNumber: Joi.number().valid(4).default(4),
          isWorking: Joi.boolean().required(),
          needsAttention: Joi.boolean().default(false),
          notes: Joi.string().max(500),
          photos: Joi.array().items(Joi.string())
        })
      })
    }),
    summary: Joi.string().max(1000),
    signature: Joi.string()
  }),

  // Query parameter schemas
  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    search: Joi.string().trim(),
    status: Joi.string(),
    role: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date()
  }),

  // MongoDB ObjectId validation
  objectId: Joi.string().hex().length(24).required()
};

module.exports = {
  validate,
  schemas
};

