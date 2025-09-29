import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faUpload, faTimes, faCheck, faPaw } from '@fortawesome/free-solid-svg-icons';

const PetAvatarSelector = ({ currentAvatar, onAvatarChange, petType = 'dog' }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Comprehensive default pet avatars organized by type
  const defaultAvatars = {
    dog: [
      '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🐾',
      // Custom cartoon dog faces (using emojis as placeholders)
      '🟤', '🟫', '⚫', '🔵', '🟡', '🔴', '🟠', '🟢'
    ],
    cat: [
      '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐆', '🐾', '😸',
      // Custom cartoon cat faces
      '😺', '😻', '😽', '🙀', '😿', '😾', '🎭', '🎨'
    ],
    bird: [
      '🐦', '🦅', '🦉', '🦜', '🐧', '🦆', '🦢', '🐔',
      '🐓', '🦃', '🕊️', '🦤', '🦚', '🐾', '🥚', '🪶'
    ],
    rabbit: [
      '🐰', '🐇', '🐾', '🥕', '🌸', '🌿', '🟤', '🟫',
      '⚪', '⚫', '🔵', '🟡', '🟠', '🟢', '🔴', '💝'
    ],
    fish: [
      '🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦐', '🦞',
      '🐚', '⭐', '🌊', '💙', '🔵', '🟡', '🟠', '🟢'
    ],
    hamster: [
      '🐹', '🐭', '🐾', '🌰', '🥜', '🟤', '🟫', '⚪',
      '⚫', '🔵', '🟡', '🟠', '🟢', '🔴', '💛', '🤎'
    ],
    reptile: [
      '🐢', '🦎', '🐍', '🐊', '🦕', '🦖', '🥚', '🌿',
      '🟢', '🟡', '🟤', '🟫', '⚫', '🔴', '🟠', '💚'
    ],
    other: [
      '🐾', '❤️', '🌟', '⭐', '🎈', '🎨', '🌈', '☀️',
      '🌙', '⚡', '🔥', '💫', '✨', '🎭', '🎪', '🎊'
    ]
  };

  // Get avatars for current pet type
  const getAvatarsForType = () => {
    const typeAvatars = defaultAvatars[petType.toLowerCase()] || defaultAvatars.other;
    // Add some universal favorites
    const universalAvatars = ['🐾', '❤️', '⭐', '🌟'];
    return [...typeAvatars, ...universalAvatars];
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('image', file);

      // Upload to server
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setUploadedImage(data.data.imageUrl);
        setSelectedAvatar(data.data.imageUrl);
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  // Confirm selection
  const handleConfirm = () => {
    onAvatarChange(selectedAvatar);
    setShowModal(false);
  };

  // Cancel selection
  const handleCancel = () => {
    setSelectedAvatar(currentAvatar);
    setUploadedImage(null);
    setShowModal(false);
  };

  return (
    <div className="pet-avatar-selector">
      {/* Current Avatar Display */}
      <div className="current-avatar" onClick={() => setShowModal(true)}>
        {currentAvatar ? (
          currentAvatar.startsWith('http') ? (
            <img src={currentAvatar} alt="Pet avatar" className="avatar-image" />
          ) : (
            <span className="avatar-emoji">{currentAvatar}</span>
          )
        ) : (
          <div className="default-avatar">
            <FontAwesomeIcon icon={faPaw} />
          </div>
        )}
        <div className="change-overlay">
          <FontAwesomeIcon icon={faCamera} />
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showModal && (
        <div className="avatar-modal-overlay" onClick={handleCancel}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Choose Pet Avatar</h3>
              <button className="close-btn" onClick={handleCancel}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </header>

            <div className="modal-content">
              {/* Upload Section */}
              <div className="upload-section">
                <h4>Upload Custom Photo</h4>
                <div className="upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <FontAwesomeIcon icon={faUpload} />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  <p>JPG, PNG, or GIF • Max 5MB</p>
                </div>

                {/* Show uploaded preview */}
                {uploadedImage && (
                  <div className="uploaded-preview">
                    <img src={uploadedImage} alt="Uploaded" />
                  </div>
                )}
              </div>

              {/* Default Avatars Section */}
              <div className="default-avatars-section">
                <h4>Choose from Default Avatars</h4>
                <div className="pet-type-info">
                  <FontAwesomeIcon icon={faPaw} />
                  <span>Perfect for {petType}s</span>
                </div>
                
                <div className="avatars-grid">
                  {getAvatarsForType().map((avatar, index) => (
                    <button
                      key={index}
                      className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                      onClick={() => handleAvatarSelect(avatar)}
                    >
                      <span className="avatar-emoji">{avatar}</span>
                      {selectedAvatar === avatar && (
                        <div className="selected-indicator">
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Section */}
              {selectedAvatar && (
                <div className="preview-section">
                  <h4>Preview</h4>
                  <div className="avatar-preview">
                    {selectedAvatar.startsWith('http') ? (
                      <img src={selectedAvatar} alt="Preview" />
                    ) : (
                      <span className="preview-emoji">{selectedAvatar}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <footer className="modal-footer">
              <button className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleConfirm}
                disabled={!selectedAvatar}
              >
                <FontAwesomeIcon icon={faCheck} />
                Confirm
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetAvatarSelector;