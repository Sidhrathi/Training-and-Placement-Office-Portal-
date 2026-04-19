import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import '../styles/JobModal.css';

const JobDriveModal = ({ 
  show, 
  onHide, 
  jobFormData, 
  handleJobInputChange, 
  handleBranchSelection, 
  handleAddRound, 
  handleRoundChange, 
  handleRemoveRound, 
  handleSubmitJobDrive,
  isLoading = false
}) => {
  return (    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      className="custom-job-modal"
      dialogClassName="modal-dialog-centered"
      style={{ zIndex: 1050 }}
    >
      <Modal.Header closeButton className="custom-modal-header">
        <Modal.Title>Post New Job Drive</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="custom-modal-body">
        <Form id="jobDriveForm" className="job-form">
          <div className="form-section">
            <h5>Company Details</h5>
            <Row>
              <Col md={6}>
                <Form.Group controlId="companyName">
                  <Form.Label>Company Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="companyName"
                    value={jobFormData.companyName}
                    onChange={handleJobInputChange}
                    required
                  />
                </Form.Group>
              </Col>              <Col md={6}>
                <Form.Group controlId="companyWebsite">
                  <Form.Label data-optional>Company Website</Form.Label>
                  <Form.Control
                    type="url"
                    name="companyWebsite"
                    value={jobFormData.companyWebsite}
                    onChange={handleJobInputChange}
                    placeholder="https://example.com"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="category">
              <Form.Label>Category *</Form.Label>
              <Form.Control
                as="select"
                name="category"
                value={jobFormData.category}
                onChange={handleJobInputChange}
                required
              >
                <option value="IT">IT</option>
                <option value="Core">Core</option>
                <option value="Management">Management</option>
              </Form.Control>
            </Form.Group>
          </div>

          <div className="form-section">
            <h5>Job Details</h5>
            <Row>
              <Col md={6}>
                <Form.Group controlId="jobRole">
                  <Form.Label>Job Role *</Form.Label>
                  <Form.Control
                    type="text"
                    name="jobRole"
                    value={jobFormData.jobRole}
                    onChange={handleJobInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="type">
                  <Form.Label>Job Type *</Form.Label>
                  <Form.Control
                    as="select"
                    name="type"
                    value={jobFormData.type}
                    onChange={handleJobInputChange}
                    required
                  >
                    <option value="full-time">Full Time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="package.basePay">
                  <Form.Label>Base Pay (LPA) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="package.basePay"
                    value={jobFormData.package.basePay}
                    onChange={handleJobInputChange}
                    required
                    min="0"
                    step="0.1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="package.totalCTC">
                  <Form.Label>Total CTC (LPA)</Form.Label>
                  <Form.Control
                    type="number"
                    name="package.totalCTC"
                    value={jobFormData.package.totalCTC}
                    onChange={handleJobInputChange}
                    min="0"
                    step="0.1"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="location">
              <Form.Label>Location *</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={jobFormData.location}
                onChange={handleJobInputChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="description">
              <Form.Label>Job Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={jobFormData.description}
                onChange={handleJobInputChange}
                required
              />
            </Form.Group>
          </div>

          <div className="form-section">
            <h5>Eligibility Criteria</h5>
            <div className="checkbox-group mb-3">
              <Form.Label>Eligible Branches *</Form.Label>
              <div className="d-flex flex-wrap gap-3">
                {['Computer Science', 'Information Science', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'MCA'].map(branch => (
                  <Form.Check
                    key={branch}
                    type="checkbox"
                    label={branch}
                    name="eligibility.branches"
                    value={branch}
                    checked={jobFormData.eligibility.branches.includes(branch)}
                    onChange={handleBranchSelection}
                  />
                ))}
              </div>
            </div>

            <Row>
              <Col md={6}>
                <Form.Group controlId="eligibility.minCGPA">
                  <Form.Label>Minimum CGPA</Form.Label>
                  <Form.Control
                    type="number"
                    name="eligibility.minCGPA"
                    value={jobFormData.eligibility.minCGPA}
                    onChange={handleJobInputChange}
                    min="0"
                    max="10"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="eligibility.maxBacklogs">
                  <Form.Label>Maximum Backlogs</Form.Label>
                  <Form.Control
                    type="number"
                    name="eligibility.maxBacklogs"
                    value={jobFormData.eligibility.maxBacklogs}
                    onChange={handleJobInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="eligibility.minTenthPercentage">
                  <Form.Label>Minimum 10th Percentage</Form.Label>
                  <Form.Control
                    type="number"
                    name="eligibility.minTenthPercentage"
                    value={jobFormData.eligibility.minTenthPercentage}
                    onChange={handleJobInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="eligibility.minTwelfthPercentage">
                  <Form.Label>Minimum 12th Percentage</Form.Label>
                  <Form.Control
                    type="number"
                    name="eligibility.minTwelfthPercentage"
                    value={jobFormData.eligibility.minTwelfthPercentage}
                    onChange={handleJobInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="form-section">
            <h5>Drive Schedule</h5>
            <Row>
              <Col md={6}>
                <Form.Group controlId="driveDetails.startDate">
                  <Form.Label>Drive Start Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="driveDetails.startDate"
                    value={jobFormData.driveDetails.startDate}
                    onChange={handleJobInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="driveDetails.lastDateToApply">
                  <Form.Label>Last Date to Apply *</Form.Label>
                  <Form.Control
                    type="date"
                    name="driveDetails.lastDateToApply"
                    value={jobFormData.driveDetails.lastDateToApply}
                    onChange={handleJobInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="rounds-section mt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Selection Rounds</h6>
                <Button variant="outline-primary" size="sm" onClick={handleAddRound}>
                  <i className="fas fa-plus"></i> Add Round
                </Button>
              </div>
              {jobFormData.driveDetails.rounds.map((round, index) => (
                <div key={index} className="round-item mb-3 p-3 border rounded">
                  <div className="d-flex justify-content-between mb-2">
                    <h6>Round {round.roundNumber}</h6>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleRemoveRound(index)}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Round Type</Form.Label>
                        <Form.Control
                          as="select"
                          value={round.type}
                          onChange={(e) => handleRoundChange(index, 'type', e.target.value)}
                        >
                          <option value="">Select Type</option>
                          <option value="aptitude">Aptitude Test</option>
                          <option value="technical">Technical Round</option>
                          <option value="coding">Coding Round</option>
                          <option value="interview">Interview</option>
                          <option value="hr">HR Round</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={round.date}
                          onChange={(e) => handleRoundChange(index, 'date', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mt-2">
                    <Form.Label>Round Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={round.description}
                      onChange={(e) => handleRoundChange(index, 'description', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mt-2">
                    <Form.Label>Venue</Form.Label>
                    <Form.Control
                      type="text"
                      value={round.venue}
                      onChange={(e) => handleRoundChange(index, 'venue', e.target.value)}
                    />
                  </Form.Group>
                </div>
              ))}
            </div>
          </div>
        </Form>
      </Modal.Body>
        <Modal.Footer className="custom-modal-footer">
        <div className="d-flex justify-content-center w-100">          <Button 
            variant="secondary" 
            onClick={onHide} 
            className="btn-cancel"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitJobDrive} 
            type="submit" 
            form="jobDriveForm" 
            className="btn-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Posting...
              </>
            ) : (
              'Post Job Drive'
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default JobDriveModal;