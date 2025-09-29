const express = require('express');
const { body, validationResult } = require('express-validator');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules for pet creation/update
const petValidation = [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Pet name must be between 1 and 50 characters')
    .trim(),
  body('type')
    .isIn(['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'guinea-pig', 'turtle', 'snake', 'lizard', 'other'])
    .withMessage('Invalid pet type'),
  body('breed')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Breed must be less than 100 characters')
    .trim(),
  body('age.years')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Age years must be between 0 and 50'),
  body('age.months')
    .optional()
    .isInt({ min: 0, max: 11 })
    .withMessage('Age months must be between 0 and 11'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Invalid gender option'),
  body('weight.value')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Weight must be between 0 and 1000'),
  body('weight.unit')
    .optional()
    .isIn(['kg', 'lbs'])
    .withMessage('Weight unit must be kg or lbs'),
  body('color')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Color must be less than 50 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('personality')
    .optional()
    .isArray()
    .withMessage('Personality must be an array'),
  body('personality.*')
    .optional()
    .isIn(['playful', 'calm', 'energetic', 'lazy', 'friendly', 'shy', 'aggressive', 'protective', 'curious', 'independent', 'social', 'anxious'])
    .withMessage('Invalid personality trait')
];

// @route   POST /api/pets
// @desc    Create a new pet
// @access  Private
router.post('/', authenticateToken, petValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const petData = {
      ...req.body,
      owner: req.user._id
    };

    const pet = new Pet(petData);
    await pet.save();

    // Add pet to user's pets array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pets: pet._id }
    });

    await pet.populate('owner', 'username fullName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: {
        pet
      }
    });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during pet creation'
    });
  }
});

// @route   GET /api/pets/search
// @desc    Search pets
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchRegex = new RegExp(q.trim(), 'i');
    
    const pets = await Pet.find({
      $or: [
        { name: searchRegex },
        { breed: searchRegex },
        { type: searchRegex }
      ],
      isPublic: true,
      isActive: true
    })
    .populate('owner', 'username fullName profilePicture isVerified')
    .sort({ likes: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Pet.countDocuments({
      $or: [
        { name: searchRegex },
        { breed: searchRegex },
        { type: searchRegex }
      ],
      isPublic: true,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Search pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/pets/:petId
// @desc    Get pet by ID
// @access  Public
router.get('/:petId', optionalAuth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId)
      .populate('owner', 'username fullName profilePicture isVerified')
      .populate('followers', 'username fullName profilePicture');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if pet is public or user has access
    if (!pet.isPublic && (!req.user || req.user._id.toString() !== pet.owner._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'This pet profile is private'
      });
    }

    const petData = pet.getPublicProfile();

    res.json({
      success: true,
      data: {
        pet: petData
      }
    });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/pets/:petId
// @desc    Update pet
// @access  Private (owner only)
router.put('/:petId', authenticateToken, petValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const pet = await Pet.findById(req.params.petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if user owns the pet
    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own pets'
      });
    }

    // Don't allow updating the owner
    delete req.body.owner;

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.petId,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'username fullName profilePicture');

    res.json({
      success: true,
      message: 'Pet updated successfully',
      data: {
        pet: updatedPet
      }
    });
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during pet update'
    });
  }
});

// @route   DELETE /api/pets/:petId
// @desc    Delete pet
// @access  Private (owner only)
router.delete('/:petId', authenticateToken, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if user owns the pet
    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own pets'
      });
    }

    // Remove pet from owner's pets array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pets: pet._id }
    });

    // Delete the pet
    await Pet.findByIdAndDelete(req.params.petId);

    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during pet deletion'
    });
  }
});

// @route   GET /api/pets/user/:userId
// @desc    Get all pets for a user
// @access  Public
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user profile is private
    if (user.isPrivate && (!req.user || req.user._id.toString() !== req.params.userId)) {
      const isFollowing = user.followers.some(
        follower => follower._id.toString() === req.user._id.toString()
      );
      
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This user\'s pets are private'
        });
      }
    }

    const query = { owner: req.params.userId };
    
    // Only show public pets if not the owner
    if (!req.user || req.user._id.toString() !== req.params.userId) {
      query.isPublic = true;
    }

    const pets = await Pet.find(query)
      .populate('owner', 'username fullName profilePicture isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pet.countDocuments(query);

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get user pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/pets
// @desc    Get pets with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      breed, 
      age, 
      gender, 
      page = 1, 
      limit = 12, 
      sort = 'newest' 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { isPublic: true, isActive: true };

    // Apply filters
    if (type) query.type = type;
    if (breed) query.breed = new RegExp(breed, 'i');
    if (gender) query.gender = gender;
    
    if (age) {
      const ageRanges = {
        'puppy': { 'age.years': { $lte: 1 } },
        'young': { 'age.years': { $gte: 1, $lte: 3 } },
        'adult': { 'age.years': { $gte: 3, $lte: 7 } },
        'senior': { 'age.years': { $gte: 7 } }
      };
      
      if (ageRanges[age]) {
        Object.assign(query, ageRanges[age]);
      }
    }

    // Sort options
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'popular': { likes: -1 },
      'name': { name: 1 }
    };

    const pets = await Pet.find(query)
      .populate('owner', 'username fullName profilePicture isVerified')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pet.countDocuments(query);

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/pets/:petId/follow
// @desc    Follow a pet
// @access  Private
router.post('/:petId/follow', authenticateToken, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if already following
    if (pet.followers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this pet'
      });
    }

    // Add follower
    pet.followers.push(req.user._id);
    await pet.save();

    res.json({
      success: true,
      message: 'Successfully followed pet',
      data: {
        following: true,
        followersCount: pet.followers.length
      }
    });
  } catch (error) {
    console.error('Follow pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/pets/:petId/follow
// @desc    Unfollow a pet
// @access  Private
router.delete('/:petId/follow', authenticateToken, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if actually following
    if (!pet.followers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this pet'
      });
    }

    // Remove follower
    pet.followers = pet.followers.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await pet.save();

    res.json({
      success: true,
      message: 'Successfully unfollowed pet',
      data: {
        following: false,
        followersCount: pet.followers.length
      }
    });
  } catch (error) {
    console.error('Unfollow pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/pets/:petId/health
// @desc    Update pet health information
// @access  Private (owner only)
router.put('/:petId/health', authenticateToken, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if user owns the pet
    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own pet\'s health information'
      });
    }

    // Update health info
    const allowedHealthFields = [
      'isSpayedNeutered',
      'vaccinations',
      'allergies',
      'medications',
      'conditions',
      'veterinarian'
    ];

    const healthUpdates = {};
    allowedHealthFields.forEach(field => {
      if (req.body[field] !== undefined) {
        healthUpdates[`healthInfo.${field}`] = req.body[field];
      }
    });

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.petId,
      { $set: healthUpdates },
      { new: true, runValidators: true }
    ).populate('owner', 'username fullName profilePicture');

    res.json({
      success: true,
      message: 'Pet health information updated successfully',
      data: {
        pet: updatedPet
      }
    });
  } catch (error) {
    console.error('Update pet health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during health update'
    });
  }
});

module.exports = router;