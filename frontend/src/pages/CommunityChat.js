import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import { Send, Image, Video, Smile, X, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';

const EMOJI_LIST = ['😀', '😂', '😍', '😊', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🎉', '🐶', '🐱', '🐾', '🦴'];

const CommunityChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [category] = useState('general');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GROUP_CHAT_MESSAGES(category), {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedFile) {
      return;
    }

    setSending(true);
    try {
      const messageData = {
        message: newMessage.trim(),
        messageType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
        attachments: []
      };

      // Handle file upload if present
      if (selectedFile) {
        // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
        // For now, we'll use a placeholder
        messageData.attachments.push({
          url: filePreview,
          type: selectedFile.type,
          name: selectedFile.name
        });
      }

      const response = await fetch(API_ENDPOINTS.GROUP_CHAT_SEND(category), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(messageData)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
        setSelectedFile(null);
        setFilePreview(null);
        scrollToBottom();
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFilePreview('video');
    } else {
      setFilePreview('file');
    }
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(API_ENDPOINTS.GROUP_CHAT_REACT(category, messageId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ emoji })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update message reactions locally
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, reactions: data.data.reactions }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', margin: '0 auto' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading chat...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      height: 'calc(100vh - 70px)', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg-secondary)'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.5rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          💬 Community Chat
        </h2>
        <p style={{ 
          margin: '0.25rem 0 0 0', 
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          Connect with fellow pet lovers
        </p>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            color: 'var(--text-secondary)'
          }}>
            <p>No messages yet. Start the conversation! 🐾</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user._id === user._id;
            
            return (
              <div
                key={msg._id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                  gap: '0.25rem'
                }}
              >
                {/* Username */}
                {!isOwnMessage && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--primary)',
                    marginLeft: '0.5rem'
                  }}>
                    {msg.user.username}
                  </span>
                )}

                {/* Message Bubble */}
                <div style={{
                  maxWidth: '70%',
                  minWidth: '100px',
                  background: isOwnMessage 
                    ? 'linear-gradient(135deg, var(--primary), var(--secondary))' 
                    : 'var(--card-bg)',
                  color: isOwnMessage ? 'white' : 'var(--text-primary)',
                  padding: '0.75rem 1rem',
                  borderRadius: isOwnMessage 
                    ? '1rem 1rem 0.25rem 1rem' 
                    : '1rem 1rem 1rem 0.25rem',
                  boxShadow: 'var(--shadow-sm)',
                  wordWrap: 'break-word'
                }}>
                  {/* File/Image Preview */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      {msg.messageType === 'image' ? (
                        <img 
                          src={msg.attachments[0].url} 
                          alt="attachment"
                          style={{
                            maxWidth: '100%',
                            borderRadius: '0.5rem',
                            marginBottom: '0.5rem'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '0.5rem',
                          background: 'rgba(0,0,0,0.1)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem'
                        }}>
                          📎 {msg.attachments[0].name}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.message}</p>
                  
                  {/* Timestamp */}
                  <div style={{
                    fontSize: '0.7rem',
                    marginTop: '0.25rem',
                    opacity: 0.7,
                    textAlign: 'right'
                  }}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    marginTop: '0.25rem',
                    flexWrap: 'wrap'
                  }}>
                    {Object.entries(
                      msg.reactions.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg._id, emoji)}
                        style={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '1rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {emoji} {count}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Reactions */}
                {!isOwnMessage && (
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    marginTop: '0.25rem'
                  }}>
                    {['❤️', '👍', '😂', '🐾'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg._id, emoji)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          opacity: 0.5,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = 1}
                        onMouseLeave={(e) => e.target.style.opacity = 0.5}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div style={{
          padding: '1rem',
          background: 'var(--card-bg)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {filePreview && filePreview !== 'video' && filePreview !== 'file' && (
            <img 
              src={filePreview} 
              alt="preview"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '0.5rem'
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {selectedFile.name}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div style={{
          padding: '1rem',
          background: 'var(--card-bg)',
          borderTop: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '0.5rem'
        }}>
          {EMOJI_LIST.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        style={{
          padding: '1rem 1.5rem',
          background: 'var(--card-bg)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx"
          style={{ display: 'none' }}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '0.5rem'
          }}
        >
          <Paperclip size={20} />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '0.5rem'
          }}
        >
          <Smile size={20} />
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.9375rem'
          }}
        />

        <button
          type="submit"
          disabled={sending || (!newMessage.trim() && !selectedFile)}
          className="btn btn-primary"
          style={{
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Send size={18} />
          Send
        </button>
      </form>
    </div>
  );
};

export default CommunityChat;
