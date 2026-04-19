import React, { useState } from 'react';
import HeaderWithNav from './HeaderWithNav';
import Footer from './footer';
import '../styles/Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState({
    submitted: false,
    success: false,
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    // For now, we'll just simulate a successful submission
    setSubmitStatus({
      submitted: true,
      success: true,
      message: 'Thank you for your message! We will get back to you soon.'
    });
    
    // Reset form after successful submission
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-page-container">
      <HeaderWithNav />
      
      <div className="contact-page-content">
        <div className="contact-header">
          <h1>Get in Touch</h1>
          <p>Feel free to reach out to us for any inquiries about training and placement activities</p>
        </div>
        
        <div className="contact-info-wrapper">
          <div className="contact-info-section">
            <div className="contact-info-box">
              <div className="icon-container">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Our Location</h3>
              <p>KLE Technological College</p>
              <p>Hubballi, Karnataka - 580031</p>
            </div>
            
            <div className="contact-info-box">
              <div className="icon-container">
                <i className="fas fa-phone-alt"></i>
              </div>
              <h3>Phone Numbers</h3>
              <p>Main Office: +91 836-2378300</p>
              <p>Placement Cell: +91 836-2378320</p>
            </div>
            
            <div className="contact-info-box">
              <div className="icon-container">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Email Us</h3>
              <p>placement@kletech.ac.in</p>
              <p>info@kletech.ac.in</p>
            </div>
            
            <div className="contact-info-box">
              <div className="icon-container">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Office Hours</h3>
              <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
              <p>Saturday: 10:00 AM - 2:00 PM</p>
            </div>
          </div>
          
          <div className="contact-form-section">
            <div className="contact-form-container">
              <h2>Send Us a Message</h2>
              
              {submitStatus.submitted && (
                <div className={`form-status ${submitStatus.success ? 'success' : 'error'}`}>
                  {submitStatus.message}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Your Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="Enter message subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Enter your message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="submit-btn">
                  <i className="fas fa-paper-plane"></i> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="map-section">
          <h2>Find Us on Map</h2>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3849.5523029372!2d75.12362517499743!3d15.36988038529361!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb8d7352ed5e46d%3A0xfd937f12b5f46249!2sKLE%20Technological%20College!5e0!3m2!1sen!2sin!4v1683548181684!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="KLE Technological College Map"
            ></iframe>
          </div>
        </div>
        
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-container">
            <div className="faq-item">
              <h3>How can I prepare for campus placements?</h3>
              <p>We recommend focusing on strengthening your technical skills, practicing aptitude tests, and enhancing your communication abilities. Our placement cell conducts regular workshops and training sessions to help you prepare.</p>
            </div>
            
            <div className="faq-item">
              <h3>When does the placement season typically begin?</h3>
              <p>Our placement season usually starts in the month of August and continues until April of the following year. Companies visit the campus based on their recruitment cycles.</p>
            </div>
            
            <div className="faq-item">
              <h3>How can I register for placement activities?</h3>
              <p>Students can register for placement activities through the student portal. You'll need to complete your profile, upload your resume, and register for specific company drives you're interested in.</p>
            </div>
            
            <div className="faq-item">
              <h3>Are there any eligibility criteria for participating in placements?</h3>
              <p>Yes, students must maintain a minimum CGPA as specified by the College, have no active backlogs, and comply with company-specific eligibility criteria which may vary.</p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;