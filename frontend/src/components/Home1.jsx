import React from 'react';
import Footer from './footer';
import '../styles/Home.css';
import HeaderWithNav from './HeaderWithNav';
import collegeImage from '../assets/College Main Building.webp';

const Home = () => {
  const notifications = [
    {
      id: 1,
      title: "Campus Drive Update",
      message: "TCS campus recruitment drive scheduled for 15th May 2025",
      date: "2025-04-19"
    },
    {
      id: 2,
      title: "Workshop Announcement",
      message: "Resume building workshop on 22nd April 2025",
      date: "2025-04-18"
    },
    {
      id: 3,
      title: "Placement Achievement",
      message: "Twilio selected 2 CSE students with package of 43 LPA",
      date: "2025-04-10"
    }
  ];

  const highlights = [
    {
      id: 1,
      number: "43",
      suffix: "LPA",
      text: "Highest Package"
    },
    {
      id: 2,
      number: "1500+",
      suffix: "",
      text: "Placement Offers"
    },
    {
      id: 3,
      number: "100+",
      suffix: "",
      text: "Recruiting Partners"
    }
  ];

  return (
    <div className="home-container">
      <HeaderWithNav />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-image-container">
          <img 
            src={collegeImage}
            alt="KLE Technological College Campus" 
            className="hero-image" 
          />
          <div className="hero-overlay">
            <div className="hero-content">
              <h1>STUDY WITH US</h1>
              <p>We deliver an outstanding learning experience that equips our students for future success.</p>
              <div className="hero-buttons">
                <a href="#programs" className="hero-btn primary-btn">VIEW ALL PROGRAMS</a>
                <a href="/about" className="hero-btn secondary-btn">LEARN MORE</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="highlights-section">
        <div className="highlights-container">
          {highlights.map(item => (
            <div key={item.id} className="highlight-card">
              <div className="highlight-number">{item.number}<span className="highlight-suffix">{item.suffix}</span></div>
              <div className="highlight-text">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="section-header">
          <h2>About Training and Placement Cell</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-graduation-cap"></i>
            <span></span>
          </div>
        </div>
        <div className="about-content">
          <p>
            <strong>Employability is the key focus at KLE Tech College</strong> and is deeply embedded into all the programs that the College offers. 
            The College has a dedicated placement cell that ensures each student gets placed suitably both in national and international organizations.
          </p>
          <p>
            Many of our students have already occupied top job positions in globally reputed companies. The training and placement cell plays a pivotal role in helping all the pass-outs in reaching their avenues.
            The Placement Cell operates round the year helping students connect with top MNC's and has earned the varsity the accolade of 'College with Best Placements', awarded by the WCRC Leaders in 2016.
          </p>
        </div>
      </section>
      
      {/* Vision & Mission Section */}
      <section className="vision-mission-section">
        <div className="vision-mission-container">
          <div className="vision-card">
            <div className="card-icon">
              <i className="far fa-eye"></i>
            </div>
            <h2>Vision</h2>
            <p>The Training and Placement Cell of KLE Technological College envisions becoming a dynamic and student-centric platform that empowers graduates to seamlessly transition into the professional world. The Cell aims to create a strong interface between academia and industry by nurturing employability skills, fostering industry collaborations, and promoting a culture of continuous learning and innovation.</p>
          </div>
          
          <div className="mission-card">
            <div className="card-icon">
              <i className="fas fa-flag"></i>
            </div>
            <h2>Mission</h2>
            <p>Its mission is to provide comprehensive career support to students by organizing training programs, workshops, and recruitment drives that align with current industry trends. The Cell is committed to enhancing the overall personality and technical competencies of students, ensuring they are well-equipped to take on real-world challenges and contribute meaningfully to society and the organizations they join.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="section-header">
          <h2>Our Services</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-tools"></i>
            <span></span>
          </div>
        </div>
        <div className="services-grid">
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>
            <h3>Training Programs</h3>
            <p>Aptitude, Technical, and Soft Skills training to prepare students for campus interviews</p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-briefcase"></i>
            </div>
            <h3>Placement Drives</h3>
            <p>On-campus and off-campus recruitment drives with leading national and international companies</p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <h3>Resume Building</h3>
            <p>Professional assistance in creating impactful resumes and LinkedIn profiles</p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <h3>Mock Interviews</h3>
            <p>Practice interviews with industry experts to build confidence and improve performance</p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-handshake"></i>
            </div>
            <h3>Industry Connections</h3>
            <p>Building and maintaining relationships with corporate partners</p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-sitemap"></i>
            </div>
            <h3>Career Counseling</h3>
            <p>Guidance on career paths, higher education, and entrepreneurship opportunities</p>
          </div>
        </div>
      </section>

      {/* Notification Section */}
      <section className="notification-section">
        <div className="section-header">
          <h2>Latest Updates</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-bell"></i>
            <span></span>
          </div>
        </div>
        <div className="notification-container">
          {notifications.map(notification => (
            <div key={notification.id} className="notification-card">
              <div className="notification-badge">
                <i className="fas fa-bullhorn"></i>
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-date">
                  <i className="far fa-calendar-alt"></i> {new Date(notification.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="view-all-container">
          <a href="#" className="view-all-btn">View All Updates</a>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-overlay">
          <h2>Ready to Begin Your Journey?</h2>
          <p>Join the KLE Technological College community and kickstart your career</p>
          <div className="cta-buttons">
            <a href="/student-registration" className="cta-btn primary-btn">Register Now</a>
            <a href="/contact" className="cta-btn secondary-btn">Contact Us</a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="section-header">
          <h2>Contact Us</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-phone-alt"></i>
            <span></span>
          </div>
        </div>
        <div className="contact-container">
          <div className="contact-info">
            <div className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <h3>Address</h3>
              <p>MBM Engineering College</p>
              <p>Jodhpur, Rajasthan</p>
              
            </div>
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <h3>Phone</h3>
              <p>+91 836-2378103</p>
              <p>+91 836-2378105</p>
              <p>+91 836-2378106</p>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <h3>Email</h3>
              <p>placement@mbm.ac.in</p>
              <p>info@mbm.ac.in</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;