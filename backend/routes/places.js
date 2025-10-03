const express = require('express');
const router = express.Router();

// @route   GET /api/places/nearby
// @desc    Get nearby pet services using OpenStreetMap (Free, No API Key needed)
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, type = 'all' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Use Overpass API (OpenStreetMap) - completely free, no API key needed
    const radius = 5000; // 5km radius
    
    // Build Overpass query for veterinary clinics and pet stores
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="veterinary"](around:${radius},${lat},${lng});
        way["amenity"="veterinary"](around:${radius},${lat},${lng});
        node["shop"="pet"](around:${radius},${lat},${lng});
        way["shop"="pet"](around:${radius},${lat},${lng});
        node["shop"="pet_grooming"](around:${radius},${lat},${lng});
        way["shop"="pet_grooming"](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;

    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    const data = await response.json();

    if (!data.elements || data.elements.length === 0) {
      return res.json({
        success: true,
        data: {
          services: [],
          count: 0
        }
      });
    }

    // Process results
    const services = data.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => {
        const tags = element.tags;
        const isVeterinary = tags.amenity === 'veterinary';
        
        // Build address from available tags
        const addressParts = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'] || tags['addr:suburb'],
          tags['addr:postcode']
        ].filter(Boolean);
        
        const address = addressParts.length > 0 
          ? addressParts.join(', ')
          : `${element.lat.toFixed(4)}, ${element.lon.toFixed(4)}`;

        return {
          id: element.id.toString(),
          name: tags.name,
          address: address,
          phone: tags.phone || tags['contact:phone'],
          website: tags.website || tags['contact:website'],
          location: {
            lat: element.lat,
            lng: element.lon
          },
          type: isVeterinary ? 'hospital' : 'store',
          openingHours: tags.opening_hours
        };
      })
      .slice(0, 20); // Limit to 20 results

    // Filter by type if specified
    const filteredServices = type === 'all' 
      ? services 
      : services.filter(s => s.type === type);

    res.json({
      success: true,
      data: {
        services: filteredServices,
        count: filteredServices.length
      }
    });

  } catch (error) {
    console.error('Places API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby services'
    });
  }
});

// @route   GET /api/places/geocode
// @desc    Convert pincode/address to coordinates using Nominatim (Free)
// @access  Public
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address or pincode is required'
      });
    }

    // Use Nominatim (OpenStreetMap) - completely free
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'PawsConnect/1.0' // Required by Nominatim
      }
    });
    
    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid address or pincode'
      });
    }

    const location = data[0];

    res.json({
      success: true,
      data: {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
        formatted_address: location.display_name
      }
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode address'
    });
  }
});

module.exports = router;
