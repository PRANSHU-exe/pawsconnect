import React, { useState, useEffect } from 'react';
import { MapPin, Search, Phone, Navigation, ExternalLink, Cross, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry', 'Jammu and Kashmir', 'Ladakh'
];

const CITIES_BY_STATE = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kadapa'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Bellary'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Ratlam'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Navi Mumbai'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Chandigarh'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Noida'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Nainital'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Darjeeling'],
  'Delhi': ['New Delhi', 'Central Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  'Ladakh': ['Leh', 'Kargil']
};

const PetServices = () => {
  const [location, setLocation] = useState(null);
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('all'); // all, hospital, store
  const [searchMethod, setSearchMethod] = useState('location'); // location, pincode, city

  useEffect(() => {
    // Request user's location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  const searchByCurrentLocation = async () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          await fetchNearbyServices(lat, lng);
        } catch (error) {
          toast.error('Failed to fetch nearby services');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get your location. Please allow location access or use another search method.');
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000
      }
    );
  };

  const searchByPincode = async (e) => {
    e.preventDefault();
    
    if (!pincode || pincode.length < 5) {
      toast.error('Please enter a valid pincode');
      return;
    }

    setLoading(true);
    
    if (!window.google || !window.google.maps) {
      toast.error('Google Maps is loading. Please try again.');
      setLoading(false);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: pincode }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        fetchNearbyServices(location.lat(), location.lng());
      } else {
        toast.error('Invalid pincode. Please try again.');
        setLoading(false);
      }
    });
  };

  const searchByCityState = async (e) => {
    e.preventDefault();
    
    if (!city || !state) {
      toast.error('Please select both city and state');
      return;
    }

    setLoading(true);
    
    if (!window.google || !window.google.maps) {
      toast.error('Google Maps is loading. Please try again.');
      setLoading(false);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const address = `${city}, ${state}, India`;
    
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        fetchNearbyServices(location.lat(), location.lng());
      } else {
        toast.error('City not found. Please try again.');
        setLoading(false);
      }
    });
  };

  const fetchNearbyServices = async (lat, lng) => {
    try {
      console.log('Fetching services for:', { lat, lng, searchType });
      
      // Wait for Google Maps to load
      if (!window.google || !window.google.maps) {
        toast.error('Google Maps is loading. Please try again in a moment.');
        setLoading(false);
        return;
      }

      const location = new window.google.maps.LatLng(lat, lng);
      const map = new window.google.maps.Map(document.createElement('div'));
      const service = new window.google.maps.places.PlacesService(map);
      
      // Search for veterinary services
      const searchVeterinary = new Promise((resolve) => {
        if (searchType === 'store') {
          resolve([]);
          return;
        }
        
        service.nearbySearch(
          {
            location: location,
            radius: 5000,
            keyword: 'veterinary pet clinic animal hospital'
          },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results || []);
            } else {
              resolve([]);
            }
          }
        );
      });

      // Search for pet stores
      const searchStores = new Promise((resolve) => {
        if (searchType === 'hospital') {
          resolve([]);
          return;
        }
        
        service.nearbySearch(
          {
            location: location,
            radius: 5000,
            keyword: 'pet store pet shop'
          },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results || []);
            } else {
              resolve([]);
            }
          }
        );
      });

      const [vetResults, storeResults] = await Promise.all([searchVeterinary, searchStores]);
      const allResults = [...vetResults, ...storeResults].slice(0, 20);

      if (allResults.length === 0) {
        setServices([]);
        toast('No services found in this area. Try a different location.', {
          icon: 'ℹ️',
        });
        setLoading(false);
        return;
      }

      // Get details for each place
      const detailedResults = [];
      let processed = 0;

      allResults.forEach((place) => {
        service.getDetails(
          { placeId: place.place_id, fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'opening_hours', 'types'] },
          (details, detailStatus) => {
            processed++;
            
            if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && details) {
              const isHospital = details.types?.some(t => t.includes('veterinary')) || 
                                place.types?.some(t => t.includes('veterinary'));
              
              detailedResults.push({
                id: place.place_id,
                name: details.name || place.name,
                address: details.formatted_address || place.vicinity,
                rating: details.rating || place.rating,
                phone: details.formatted_phone_number,
                website: details.website,
                isOpen: details.opening_hours?.open_now,
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                type: isHospital ? 'hospital' : 'store'
              });
            }

            // When all processed, update state
            if (processed === allResults.length) {
              setServices(detailedResults);
              toast.success(`Found ${detailedResults.length} services nearby`);
              setLoading(false);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch nearby services.');
      setServices([]);
      setLoading(false);
    }
  };

  const openInGoogleMaps = (service) => {
    const query = encodeURIComponent(`${service.name} ${service.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #8B5CF6, #10B981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🏥 Pet Health & Wellness Services
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Find nearby veterinary hospitals, clinics, and pet medical stores
          </p>
        </div>

        {/* Search Section */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          {/* Search Type Selector */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {[
              { value: 'all', label: 'All Services', icon: '🏥' },
              { value: 'hospital', label: 'Hospitals & Clinics', icon: '🏥' },
              { value: 'store', label: 'Medical Stores', icon: '🏪' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setSearchType(type.value)}
                className={searchType === type.value ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          {/* Search Method Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {[
              { value: 'location', label: '📍 Current Location' },
              { value: 'city', label: '🏙️ City & State' },
              { value: 'pincode', label: '📮 Pincode' }
            ].map(method => (
              <button
                key={method.value}
                onClick={() => setSearchMethod(method.value)}
                className={searchMethod === method.value ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* Current Location Search */}
          {searchMethod === 'location' && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={searchByCurrentLocation}
                disabled={loading}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
              >
                <Navigation size={18} />
                {loading ? 'Getting Location...' : 'Use Current Location'}
              </button>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Click to allow location access
              </p>
            </div>
          )}

          {/* City & State Search */}
          {searchMethod === 'city' && (
            <form onSubmit={searchByCityState} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              {/* State Dropdown - First */}
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setCity(''); // Reset city when state changes
                }}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select State First</option>
                {INDIAN_STATES.map(stateName => (
                  <option key={stateName} value={stateName}>{stateName}</option>
                ))}
              </select>

              {/* City Dropdown - Second (only shows when state is selected) */}
              {state && (
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select City</option>
                  {CITIES_BY_STATE[state]?.map(cityName => (
                    <option key={cityName} value={cityName}>{cityName}</option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                disabled={loading || !state || !city}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              >
                <Search size={18} />
                Search by City
              </button>
            </form>
          )}

          {/* Pincode Search */}
          {searchMethod === 'pincode' && (
            <form onSubmit={searchByPincode} style={{
              display: 'flex',
              gap: '1rem',
              maxWidth: '500px',
              margin: '0 auto',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter pincode (e.g., 110001, 400001)"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Search size={18} />
                Search
              </button>
            </form>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '3rem', height: '3rem', margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
              Searching for nearby services...
            </p>
          </div>
        )}

        {/* Services List */}
        {!loading && services.length > 0 && (
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1.5rem'
            }}>
              Found {services.length} Services Nearby
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {services.map((service) => (
                <div
                  key={service.id}
                  className="card hover-lift"
                  style={{ padding: '1.5rem' }}
                >
                  {/* Service Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: service.type === 'hospital' 
                        ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                        : 'linear-gradient(135deg, #10B981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}>
                      {service.type === 'hospital' ? <Cross size={24} color="white" /> : <Store size={24} color="white" />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {service.name}
                      </h3>
                      
                      {service.rating && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: '#F59E0B' }}>⭐</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                            {service.rating}
                          </span>
                          {service.isOpen !== undefined && (
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.125rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: service.isOpen ? '#D1FAE5' : '#FEE2E2',
                              color: service.isOpen ? '#059669' : '#DC2626'
                            }}>
                              {service.isOpen ? 'Open' : 'Closed'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem'
                  }}>
                    <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{service.address}</span>
                  </div>

                  {/* Phone */}
                  {service.phone && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      <Phone size={16} />
                      <a
                        href={`tel:${service.phone}`}
                        style={{
                          color: 'var(--primary)',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        {service.phone}
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <button
                      onClick={() => openInGoogleMaps(service)}
                      className="btn btn-primary btn-sm"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Navigation size={16} />
                      Directions
                    </button>

                    {service.website && (
                      <button
                        onClick={() => window.open(service.website, '_blank')}
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <ExternalLink size={16} />
                        Website
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && services.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No Services Found
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Try searching with your current location or enter a different pincode
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetServices;
