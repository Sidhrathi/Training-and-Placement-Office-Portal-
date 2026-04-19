import React from 'react';
import HeaderWithNav from './HeaderWithNav';
import Footer from './footer';
import '../styles/AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-container">
      <HeaderWithNav />

      <div className="about-hero">
        <div className="about-hero-overlay">
          <h1>Shaping Tomorrow's Leaders</h1>
          <p>Excellence in Placements and Career Development Since 2011</p>
        </div>
      </div>

      <div className="about-content">
        <div className="about-header">
          <h1>About Training and Placement Cell</h1>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-graduation-cap"></i>
            <span></span>
          </div>
        </div>

        <div className="about-description">
          <div className="about-description-text">
            <p>
              <strong>Employability is the key focus at KLE Tech University</strong> and is deeply embedded into all the programs that the university offers. 
              The university has a dedicated placement cell that ensures each student gets placed suitably both in national and international organizations.
            </p>
            <p>
              Many of our students have already occupied top job positions in globally reputed companies. The training and placement cell plays a pivotal role in helping all the pass-outs in reaching their avenues.
              The Placement Cell operates round the year helping students connect with top MNC's and has earned the varsity the accolade of 'University with Best Placements', awarded by the WCRC Leaders in 2016.
            </p>
          </div>
          <div className="about-stats">
            <div className="stat-item">
              <div className="stat-value"><span className="counter">43</span>LPA</div>
              <div className="stat-label">Highest Package</div>
            </div>
            <div className="stat-item">
              <div className="stat-value"><span className="counter">1500</span>+</div>
              <div className="stat-label">Offers 2022 Batch</div>
            </div>
            <div className="stat-item">
              <div className="stat-value"><span className="counter">40</span>+</div>
              <div className="stat-label">Students by Amazon AWS</div>
            </div>
            <div className="stat-item">
              <div className="stat-value"><span className="counter">100</span>+</div>
              <div className="stat-label">Recruiting Partners</div>
            </div>
          </div>
        </div>

        <div className="about-cards-section">
          <div className="about-section">
            <div className="about-icon">
              <i className="fas fa-bullseye"></i>
            </div>
            <h2>Objectives</h2>
            <ul className="objectives-list">
              <li>Create awareness among students regarding available career options and help them in identifying their career objectives.</li>
              <li>Guide the students in developing skills and job-search strategies required to achieve their career objectives.</li>
              <li>Identify suitable potential employers and help them achieve their hiring goals.</li>
              <li>Organize activities concerning career planning.</li>
              <li>Act as a bridge between students, alumni and employers.</li>
              <li>Take feedback from industry and provide inputs for curriculum.</li>
            </ul>
          </div>

          <div className="about-process-section">
            <h2>Our Placement Process</h2>
            <div className="section-divider">
              <span></span>
              <i className="fas fa-briefcase"></i>
              <span></span>
            </div>
            <div className="process-timeline">
              <div className="process-step">
                <div className="process-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <h3>Pre-Placement Training</h3>
                <p>Comprehensive training on aptitude, technical skills, and soft skills development</p>
              </div>
              <div className="process-step">
                <div className="process-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <h3>Resume Building</h3>
                <p>Professional resume and LinkedIn profile creation workshops</p>
              </div>
              <div className="process-step">
                <div className="process-icon">
                  <i className="fas fa-handshake"></i>
                </div>
                <h3>Company Presentations</h3>
                <p>Interaction with corporate representatives to understand opportunities</p>
              </div>
              <div className="process-step">
                <div className="process-icon">
                  <i className="fas fa-laptop-code"></i>
                </div>
                <h3>Written Tests</h3>
                <p>Aptitude, coding, and technical assessments</p>
              </div>
              <div className="process-step">
                <div className="process-icon">
                  <i className="fas fa-users"></i>
                </div>
                <h3>Interviews</h3>
                <p>Technical, HR and managerial rounds of interviews</p>
              </div>
              <div className="process-step">
                <div className="process-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <h3>Job Offer</h3>
                <p>Final selection and offer letter distribution</p>
              </div>
            </div>
          </div>
        </div>

        <div className="industry-collab-section">
          <h2>Industry Collaboration</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-industry"></i>
            <span></span>
          </div>
          <p className="industry-intro">Subjects re-designed with inputs from Industry Experts to meet Industry requirements:</p>
          <div className="industry-collab-grid">
            <div className="collab-item">
              <h3>Automotive Electronics</h3>
              <p>Robert Bosch, KPIT</p>
            </div>
            <div className="collab-item">
              <h3>Internet of Things (IoT)</h3>
              <p>Robert Bosch</p>
            </div>
            <div className="collab-item">
              <h3>Computer Networking</h3>
              <p>Microsoft, Akamai, Juniper Networks</p>
            </div>
            <div className="collab-item">
              <h3>Multicore Embedded Systems</h3>
              <p>Robert Bosch</p>
            </div>
            <div className="collab-item">
              <h3>AUTOSAR & Infotainment</h3>
              <p>Robert Bosch, KPIT</p>
            </div>
            <div className="collab-item">
              <h3>AI/ML/Embedded Intelligence</h3>
              <p>Samsung R&D</p>
            </div>
          </div>
        </div>

        <div className="placement-details">
          <h2>Placement Details</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-chart-line"></i>
            <span></span>
          </div>
          <p className="placement-intro">You will have abundant opportunities to get acquainted with the industry by joining internships & on-job training during your course of studies.</p>
          <div className="placement-links">
            <a href="#"><i className="far fa-file-pdf"></i> Placement Details 2024 Batch</a>
            <a href="#"><i className="far fa-file-alt"></i> Placement Details 2023 Batch</a>
            <a href="#"><i className="fas fa-building"></i> Placement Details 2022 Batch</a>
            <a href="#"><i className="fas fa-industry"></i> Placement Brochure</a>
          </div>
        </div>

        <div className="testimonials-section">
          <h2>What Our Alumni Say</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-quote-right"></i>
            <span></span>
          </div>
          <div className="testimonials-container">
            <div className="testimonial-card">
              <div className="testimonial-avatar">
                <i className="fas fa-user-circle"></i>
              </div>
              <p className="testimonial-text">"Events conducted by CTIE, such as PUPA, Butterfly and Intel Ideation camp allow us to test our ideas and develop entrepreneurial skills."</p>
              <div className="testimonial-author">
                <h4>Deepa Hegde</h4>
                <p>Deloitte</p>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-avatar">
                <i className="fas fa-user-circle"></i>
              </div>
              <p className="testimonial-text">"The placement cell provided excellent guidance and resources that helped me secure a position in a top company. The mock interviews and technical training were particularly valuable."</p>
              <div className="testimonial-author">
                <h4>KLE Tech Alumni</h4>
                <p>2022 Graduate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="about-columns">
          <div className="vision-box">
            <div className="card-icon">
              <i className="far fa-eye"></i>
            </div>
            <h2>Vision</h2>
            <p>
              To be the preferred talent partner for leading organizations worldwide by providing maximum placements to students through suitable career
              guidance and campus recruitment training for the best opportunities to thrive in their career.
            </p>
          </div>
          
          <div className="mission-box">
            <div className="card-icon">
              <i className="fas fa-flag"></i>
            </div>
            <h2>Mission</h2>
            <p>
              To train the students as per the industry-required skills and
              provide suitable opportunities. The career guidance programs are
              conducted to encourage higher education and foster an entrepreneurial mindset among students.
            </p>
          </div>
        </div>

        <div className="team-section">
          <h2>Placement Officer Contact Details</h2>
          <div className="section-divider">
            <span></span>
            <i className="fas fa-users"></i>
            <span></span>
          </div>
          <div className="team-members">
            <div className="team-member">
              <div className="member-photo">
                <i className="fas fa-user-circle"></i>
              </div>
              <h3>Prof. C. D. Kerure</h3>
              <p className="member-position">For Engineering Placements (BE / M.Tech.)</p>
              <p className="member-contact"><i className="fas fa-phone"></i> +91 98451 17196</p>
              <p className="member-contact"><i className="fas fa-envelope"></i> placement@kletech.ac.in</p>
            </div>
            <div className="team-member">
              <div className="member-photo">
                <i className="fas fa-user-circle"></i>
              </div>
              <h3>Prof. R. C. Patil</h3>
              <p className="member-position">For Management Placements (BBA / B.Com. / MBA)</p>
              <p className="member-contact"><i className="fas fa-phone"></i> +91 99860 19001</p>
              <p className="member-contact"><i className="fas fa-envelope"></i> smsrplacement@kletech.ac.in</p>
            </div>
            <div className="team-member">
              <div className="member-photo">
                <i className="fas fa-user-circle"></i>
              </div>
              <h3>Dr. Tejas Rayangoudar</h3>
              <p className="member-position">For Computer Applications Placements (BCA / MCA)</p>
              <p className="member-contact"><i className="fas fa-phone"></i> +91 81056 02601</p>
              <p className="member-contact"><i className="fas fa-envelope"></i> bca.mca.placement@kletech.ac.in</p>
            </div>
          </div>
        </div>

        <div className="social-connect">
          <h2>Stay Connected</h2>
          <div className="social-links">
            <a href="mailto:placement@kletech.ac.in" className="social-icon email"><i className="fas fa-envelope"></i></a>
            <a href="#" className="social-icon facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="social-icon linkedin"><i className="fab fa-linkedin-in"></i></a>
            <a href="#" className="social-icon youtube"><i className="fab fa-youtube"></i></a>
            <a href="#" className="social-icon instagram"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;