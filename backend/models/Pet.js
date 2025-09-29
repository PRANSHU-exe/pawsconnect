const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'guinea-pig', 'turtle', 'snake', 'lizard', 'other']
  },
  breed: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Mixed'
  },
  age: {
    years: {
      type: Number,
      min: 0,
      max: 50,
      default: 0
    },
    months: {
      type: Number,
      min: 0,
      max: 11,
      default: 0
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  weight: {
    value: {
      type: Number,
      min: 0,
      max: 1000
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  color: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  photos: [{
    url: String,
    caption: {
      type: String,
      maxlength: 200
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  personality: [{
    type: String,
    enum: ['playful', 'calm', 'energetic', 'lazy', 'friendly', 'shy', 'aggressive', 'protective', 'curious', 'independent', 'social', 'anxious']
  }],
  // Health information
  healthInfo: {
    isSpayedNeutered: {
      type: Boolean,
      default: false
    },
    vaccinations: [{
      name: String,
      date: Date,
      nextDue: Date
    }],
    allergies: [{
      type: String,
      maxlength: 100
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date
    }],
    conditions: [{
      name: String,
      diagnosedDate: Date,
      notes: String
    }],
    veterinarian: {
      name: String,
      clinic: String,
      phone: String,
      email: String
    }
  },
  // Dates
  birthDate: {
    type: Date
  },
  adoptionDate: {
    type: Date
  },
  // Social features
  likes: {
    type: Number,
    default: 0
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Status
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
petSchema.index({ owner: 1 });
petSchema.index({ type: 1 });
petSchema.index({ createdAt: -1 });

// Virtual for age display
petSchema.virtual('ageDisplay').get(function() {
  if (this.age.years === 0) {
    return `${this.age.months} month${this.age.months !== 1 ? 's' : ''}`;
  } else if (this.age.months === 0) {
    return `${this.age.years} year${this.age.years !== 1 ? 's' : ''}`;
  } else {
    return `${this.age.years} year${this.age.years !== 1 ? 's' : ''} ${this.age.months} month${this.age.months !== 1 ? 's' : ''}`;
  }
});

// Virtual for weight display
petSchema.virtual('weightDisplay').get(function() {
  if (this.weight.value) {
    return `${this.weight.value} ${this.weight.unit}`;
  }
  return '';
});

// Method to calculate exact age from birth date
petSchema.methods.calculateAge = function() {
  if (!this.birthDate) return { years: this.age.years, months: this.age.months };
  
  const now = new Date();
  const birth = new Date(this.birthDate);
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months };
};

// Method to get public profile
petSchema.methods.getPublicProfile = function() {
  const pet = this.toObject();
  if (!this.isPublic) {
    // Remove sensitive information for private profiles
    delete pet.healthInfo;
  }
  return pet;
};

// Ensure virtual fields are serialized
petSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Pet', petSchema);