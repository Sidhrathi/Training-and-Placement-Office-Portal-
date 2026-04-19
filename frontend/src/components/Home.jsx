import React, {useState} from 'react';
import Footer from './footer';
import '../styles/Home.css';
import HeaderWithNav from './HeaderWithNav';

import collegeImage from "../assets/College Main Building.webp";


const Home = () => {
  const [showAll, setShowAll] = useState(false);
  
const notifications = [
  {
    id: 1,
    title: "Highest Placement Package (2024)",
    message:
      "INR 20.71 LPA was offered to a BTech Petroleum Engineering student at MBM University in 2024. Top recruiters included Larsen & Toubro, JK Lakshmi Cement, and Adani Group.",
    date: "2024-07-01",
  },
  {
    id: 2,
    title: "CSE Branch Placement Update",
    message:
      "29 CSE students placed with a maximum package of ₹10 LPA, average of ₹6.55 LPA, and median of ₹6 LPA",
    date: "2025-07-01",
  },
  {
    id: 3,
    title: "University Placement Summary",
    message:
      "356 students placed across all branches. Highest package: ₹28 LPA (Petroleum), average: ₹6.13 LPA",
    date: "2025-07-01",
  },
  {
    id: 4,
    title: "Electrical Engineering Success",
    message:
      "23 EE students placed with a maximum package of ₹7.6 LPA, average of ₹4.8 LPA, and median of ₹4.8 LPA",
    date: "2025-07-01",
  },
  {
    id: 5,
    title: "Petroleum Engineering Highlight",
    message:
      "6 Petroleum students placed with a maximum package of ₹28 LPA, average of ₹11.75 LPA, and median of ₹6.25 LPA",
    date: "2025-07-01",
  },
  {
    id: 6,
    title: "Engineering Physics Update",
    message:
      "7 students placed with a maximum package of ₹20 LPA, average of ₹7.6 LPA, and median of ₹6 LPA",
    date: "2025-07-01",
  },
  {
    id: 7,
    title: "IT Branch Placement",
    message:
      "23 IT students placed with a maximum package of ₹12 LPA, average of ₹6.25 LPA, and median of ₹6 LPA",
    date: "2025-07-01",
  },
  {
    id: 8,
    title: "Civil Engineering Placement",
    message:
      "26 Civil students placed with a maximum package of ₹10.1 LPA, average of ₹7.63 LPA, and median of ₹6 LPA",
    date: "2025-07-01",
  },
  {
    id: 9,
    title: "Chemical Engineering Update",
    message:
      "23 Chemical students placed with a maximum package of ₹6.6 LPA, average of ₹5.6 LPA, and median of ₹5.6 LPA",
    date: "2025-07-01",
  },
  {
    id: 10,
    title: "Mining Engineering Performance",
    message:
      "28 Mining students placed with a maximum package of ₹7.6 LPA, average of ₹6.3 LPA, and median of ₹6 LPA",
    date: "2025-07-01",
  },
];


  const highlights = [
    {
      id: 1,
      number: "20.71",
      suffix: "LPA",
      text: "Highest Package",
    },
    {
      id: 2,
      number: " 356+",
      suffix: "",
      text: "Placement Offers",
    },
    {
      id: 3,
      number: "100+",
      suffix: "",
      text: "Recruiting Partners",
    },
  ];

    const displayedNotifications = showAll
      ? notifications
      : notifications.slice(0, 6);
  return (
    <div className="home-container">
      <HeaderWithNav />

      {/* Hero Section */}
      <section className="hero-section mt-5">
        <div className="hero-image-container">
          <img
            src={collegeImage}
            alt="MBM University Campus"
            className="hero-image"
          />
          <div className="hero-overlay">
            <div className="hero-content">
              <h1>STUDY WITH US</h1>
              <p>
                We deliver an outstanding learning experience that equips our
                students for future success.
              </p>
              <div className="hero-buttons">
                <a href="#programs" className="hero-btn primary-btn">
                  VIEW ALL PROGRAMS
                </a>
                <a href="/about" className="hero-btn secondary-btn">
                  LEARN MORE
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="highlights-section">
        <div className="highlights-container">
          {highlights.map((item) => (
            <div key={item.id} className="highlight-card">
              <div className="highlight-number">
                {item.number}
                <span className="highlight-suffix">{item.suffix}</span>
              </div>
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
            <strong>Employability is the key focus at MBM University</strong>{" "}
            and is deeply embedded into all the programs that the university
            offers. The university has a dedicated placement cell that ensures
            each student gets placed suitably both in national and international
            organizations.
          </p>
          <p>
            Many of our students have already occupied top job positions in
            globally reputed companies. The training and placement cell plays a
            pivotal role in helping all the pass-outs in reaching their avenues.
            The Placement Cell operates round the year helping students connect
            with top MNC's and has earned the varsity the accolade of
            'University with Best Placements
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
            <p>
              The Training and Placement Cell of M.B.M University envisions
              becoming a dynamic and student-centric platform that empowers
              graduates to seamlessly transition into the professional world.
              The Cell aims to create a strong interface between academia and
              industry by nurturing employability skills, fostering industry
              collaborations, and promoting a culture of continuous learning and
              innovation.
            </p>
          </div>

          <div className="vision-card">
            <div className="card-icon">
              <i className="fas fa-flag"></i>
            </div>
            <h2>Mission</h2>
            <p>
              Its mission is to provide comprehensive career support to students
              by organizing training programs, workshops, and recruitment drives
              that align with current industry trends. The Cell is committed to
              enhancing the overall personality and technical competencies of
              students, ensuring they are well-equipped to take on real-world
              challenges and contribute meaningfully to society and the
              organizations they join.
            </p>
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
            <p>
              Aptitude, Technical, and Soft Skills training to prepare students
              for campus interviews
            </p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-briefcase"></i>
            </div>
            <h3>Placement Drives</h3>
            <p>
              On-campus and off-campus recruitment drives with leading national
              and international companies
            </p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <h3>Resume Building</h3>
            <p>
              Professional assistance in creating impactful resumes and LinkedIn
              profiles
            </p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <h3>Mock Interviews</h3>
            <p>
              Practice interviews with industry experts to build confidence and
              improve performance
            </p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-handshake"></i>
            </div>
            <h3>Industry Connections</h3>
            <p>
              Building and maintaining relationships with corporate partners
            </p>
          </div>
          <div className="service-item">
            <div className="service-icon">
              <i className="fas fa-sitemap"></i>
            </div>
            <h3>Career Counseling</h3>
            <p>
              Guidance on career paths, higher education, and entrepreneurship
              opportunities
            </p>
          </div>
        </div>
      </section>

      {/* Notification Section */}
      <section className="services-section">
        <div className="section-header">
          <h2>Latest Updates</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-tools"></i>
            <span></span>
          </div>
        </div>

        <div className="services-grid">
          {(showAll ? notifications : notifications.slice(0, 6)).map(
            (notification) => (
              <div key={notification.id} className="service-item">
                <div className="service-icon">
                  <i className="fas fa-chalkboard-teacher"></i>
                </div>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <p>
                  <b>
                    {new Date(notification.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </b>
                </p>
              </div>
            )
          )}
        </div>

        {/* View All Button */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button onClick={() => setShowAll(!showAll)} className="view-all-btn cta-btn primary-btn">
            {showAll ? "Show Less" : "View All Updates"}
          </button>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-overlay">
          <h2>Ready to Begin Your Journey?</h2>
          <p>Join the M.B.M University community and kickstart your career</p>
          <div className="cta-buttons">
            <a href="/student-registration" className="cta-btn primary-btn">
              Register Now
            </a>
            <a href="/contact" className="cta-btn secondary-btn">
              Contact Us
            </a>
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
              <p>M.B.M University</p>
              <p>Air Force Area, Jodhpur</p>
              <p>Rajasthan - 342011</p>
            </div>
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <h3>Phone</h3>
              <p>+91 9414918856</p>
              <p>+91 8089006631</p>
              <p>+91 836-2378106</p>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <h3>Email</h3>
              <p>tpo@mbm.ac.in</p>
              <p>tpocellmbm@gmail.com</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;