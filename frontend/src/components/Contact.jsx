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

  const tpoMembers = [
    {
      name: "Dr. Kailash Chaudhary",
      designation: "Assistant Professor",
      department: "Mechanical Engineering",
      phone: "+91-99290 81113",
    },
    {
      name: "Mr. Abhishek Gour",
      designation: "Assistant Professor",
      department: "Computer Science and Eng.",
      phone: "+91-96364 80077",
    },
    {
      name: "Mr. Pradeep Kumar",
      designation: "Assistant Professor",
      department: "Mechanical Engineering",
      phone: "+91-94603 77760",
    },
    {
      name: "Dr. Emarti Kumari",
      designation: "Assistant Professor",
      department: "Mechanical Engineering",
      phone: "+91-99290 81113",
    },
    {
      name: "Mr. Rohit Rawal",
      designation: "Assistant Professor",
      department: "Mining Engineering",
      phone: "+91-94603 77760",
    },
    {
      name: "Dr. Sunil Saraswat",
      designation: "Associate Professor",
      department: "Chemical Engineering",
      phone: "+91-99290 81113",
    },
    {
      name: "Mr. Sanu Meena",
      designation: "Assistant Professor",
      department: "Civil Engineering",
      phone: "+91-85628 81285",
    },
    {
      name: "Mr. Kapil Parihar",
      designation: "Assistant Professor",
      department: "Electronics and Communication Eng.",
      phone: "+91-94698 21267",
    },
    {
      name: "Ms. Santosh Meena",
      designation: "Assistant Professor",
      department: "Mechanical Engineering",
      phone: "+91-88959 11148",
    },
    {
      name: "Dr. Pulkit Gupta",
      designation: "Assistant Professor",
      department: "Architecture & Town Planning",
      phone: "",
    },
  ];

  const coreTeam = [
    {
      name: "Anirudh Sharma",
      phone: "+91-8003344454",
      email: "as.anirudh21@gmail.com",
      branch: "Electrical Engineering",
    },
    {
      name: "Devarsh Sharma",
      phone: "+91-9214355185",
      email: "devarshsharma19@gmail.com",
      branch: "Electrical Engineering",
    },
    {
      name: "Manya Singhvi",
      phone: "+91-8209503444",
      email: "Manyasinghvi10@gmail.com",
      branch: "Electrical Engineering",
    },
    {
      name: "Mridul Bansal",
      phone: "+91-8769438183",
      email: "mridulbansal2001@gmail.com",
      branch: "Information Technology",
    },
    {
      name: "Nandini Rajpurohit",
      phone: "+91-8209503444",
      email: "nandinirajpurohit199@gmail.com",
      branch: "Mechanical Engineering",
    },
    {
      name: "Riya Rajpurohit",
      phone: "+91-8209503444",
      email: "riyarajpurohit05@gmail.com",
      branch: "Electronics and Computer Engineering",
    },
    {
      name: "Saurabh Jangid",
      phone: "+91-7589631263",
      email: "saurabh.jangid.369@gmail.com",
      branch: "Artificial Intelligence and Data Science",
    },
    {
      name: "Shifa Gyas Usmani",
      phone: "+91-7014251935",
      email: "shifagyasusmani5@gmail.com",
      branch: "Artificial Intelligence and Data Science",
    },
    {
      name: "Sneha Maheshwari",
      phone: "+91-8209503444",
      email: "snehamaheshwari820@gmail.com",
      branch: "Electronics and Computer Engineering",
    },
    {
      name: "Vasu Agarwal",
      phone: "+91-8209503444",
      email: "vasuagarwal156@gmail.com",
      branch: "Artificial Intelligence and Data Science",
    },
    {
      name: "Vijay Laxmi Pareek",
      phone: "+91-8209503444",
      email: "pareekvlp24@gmail.com",
      branch: "Electronics and Communication Engineering",
    },
  ];


  return (
    <div className="contact-page-container">
      <HeaderWithNav />

      <div className="contact-page-content">
        <div className="contact-header">
          <h1>Get in Touch</h1>
          <p>
            Feel free to reach out to us for any inquiries about training and
            placement activities
          </p>
        </div>

        <div className="contact-info-wrapper">
          <div className="contact-info-section">
            <div className="contact-info-box">
              <div className="icon-container">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Our Location</h3>
              <p>Lachoo Memorial College of Science & Technology</p>
              <p>Sector – A , Shastri Nagar Jodhpur , Rajasthan – India.</p>
            </div>

            <div className="contact-info-box">
              <div className="icon-container">
                <i className="fas fa-phone-alt"></i>
              </div>
              <h3>Phone Numbers</h3>
              <p>Main Office: +91 9414918856</p>
              <p>Placement Cell: +91 8089006631</p>
            </div>

            <div className="contact-info-box">
              <div className="icon-container">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Email Us</h3>
              <p>tpo@lmc.ac.in</p>
              <p>tpocell@gmail.com</p>
            </div>

            <div className="contact-info-box">
              <div className="icon-container">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Office Hours</h3>
              <p>Monday to Saturday : 8:00 AM to 2:00 PM</p>
              {/* <p>Saturday: 10:00 AM - 2:00 PM</p> */}
            </div>
          </div>

          <div className="contact-form-section">
            <div className="contact-form-container">
              <h2>Send Us a Message</h2>

              {submitStatus.submitted && (
                <div
                  className={`form-status ${
                    submitStatus.success ? "success" : "error"
                  }`}
                >
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3237.720453471964!2d72.99696757487293!3d26.26823268749056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39418c24057d5599%3A0xb35e18ef6cd00ca9!2sLachoo%20Memorial%20College%20of%20science%20and%20technology%20Jodhpur%20(autonomous%20)!5e1!3m2!1sen!2sin!4v1776275861728!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lachoo Memorial College of Science & Technology Map"
            ></iframe>
          </div>
        </div>

        {/* <div className=" m-4 bg-white border-solid rounded-lg ">
          <div className="  ">
            <h2 className=" m-3 mt-5 text-2xl font-bold ">Members, TPO Team</h2>
            <div className="grid grid-cols-3 gap-3" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginTop: "2rem",
            }}>
              {tpoMembers.map((member, index) => (
                <div
                  key={index}
                  style={{
                  
                    
                    margin: "10px",
                    marginBottom: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "1rem",
                    width: "250px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  }}
                >
                  <h3>{member.name}</h3>
                  <p>
                    <strong>{member.designation}</strong>
                  </p>
                  <p>{member.department}</p>
                  {member.phone && <p>📞 {member.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 mb-7 mx-7 bg-white border-solid rounded-lg">
          <h2 className="text-2xl m-3 mt-5 font-bold ">
            STUDENT's CORE TEAM 2024-25
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginTop: "2rem",
            }}
          >
            {coreTeam.map((student, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ccc",
                  margin: "10px",
                  marginBottom: "20px",
                  borderRadius: "10px",
                  padding: "1rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  // backgroundColor: "#f9f9f9",
                }}
              >
                <h3 style={{ marginBottom: "0.5rem" }}>{student.name}</h3>
                <p>
                  <strong>Branch:</strong> {student.branch}
                </p>
                <p>
                  <strong>Phone:</strong> {student.phone}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${student.email}`}>{student.email}</a>
                </p>
              </div>
            ))}
          </div>
        </div> */}

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-container">
            <div className="faq-item">
              <h3>How can I prepare for campus placements?</h3>
              <p>
                We recommend focusing on strengthening your technical skills,
                practicing aptitude tests, and enhancing your communication
                abilities. Our placement cell conducts regular workshops and
                training sessions to help you prepare.
              </p>
            </div>

            <div className="faq-item">
              <h3>When does the placement season typically begin?</h3>
              <p>
                Our placement season usually starts in the month of August and
                continues until April of the following year. Companies visit the
                campus based on their recruitment cycles.
              </p>
            </div>

            <div className="faq-item">
              <h3>How can I register for placement activities?</h3>
              <p>
                Students can register for placement activities through the
                student portal. You'll need to complete your profile, upload
                your resume, and register for specific company drives you're
                interested in.
              </p>
            </div>

            <div className="faq-item">
              <h3>
                Are there any eligibility criteria for participating in
                placements?
              </h3>
              <p>
                Yes, students must maintain a minimum CGPA as specified by the
                College, have no active backlogs, and comply with
                company-specific eligibility criteria which may vary.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;