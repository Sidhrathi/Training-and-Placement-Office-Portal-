const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// Get all jobs
router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;

    const jobs = await Job.find(query)
      .populate('createdBy', 'name department')
      .populate('applications.student', 'name usn branch');
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all applicants (students) for a specific job drive
router.get('/:id/applicants', protect, async (req, res) => {
  try {
    const job = await Job.findOne({ 
      _id: req.params.id,
      createdBy: req.user.id
    }).populate({
      path: 'applications.student',
      select: '-password -resume.file' // Exclude sensitive data
    });
    
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or you do not have access' 
      });
    }
    
    // Return applications array in the shape expected by frontend modal
    const applicants = (job.applications || [])
      .filter(app => app && app.student) // ensure population succeeded
      .map(app => ({
        student: app.student,
        status: app.status,
        appliedDate: app.appliedAt || app.appliedDate || app.createdAt || null
      }));

    res.json(applicants);
  } catch (error) {
    console.error('Error fetching job applicants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific job details
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('createdBy', 'name department')
      .populate('applications.student', 'name usn branch');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply for a job
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);

    // Check eligibility
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const alreadyApplied = job.applications.some(app => 
      app.student.toString() === studentId
    );
    if (alreadyApplied) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Check if past last date to apply
    if (new Date() > new Date(job.lastDateToApply)) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Validate eligibility criteria
    if (job.eligibility) {
      if (job.eligibility.branches && 
          !job.eligibility.branches.includes(student.branch)) {
        return res.status(400).json({ message: 'Branch not eligible' });
      }

      if (job.eligibility.minCGPA && 
          student.percentageDegree < job.eligibility.minCGPA) {
        return res.status(400).json({ message: 'CGPA requirement not met' });
      }

      if (job.eligibility.maxBacklogs !== undefined && 
          student.backlogs > job.eligibility.maxBacklogs) {
        return res.status(400).json({ message: 'Backlog criteria not met' });
      }

      if (job.eligibility.min10thPercentage && 
          student.percentage10 < job.eligibility.min10thPercentage) {
        return res.status(400).json({ message: '10th percentage requirement not met' });
      }

      if (job.eligibility.min12thPercentage && 
          student.percentage12 < job.eligibility.min12thPercentage) {
        return res.status(400).json({ message: '12th percentage requirement not met' });
      }
    }

    // Add application
    job.applications.push({
      student: studentId,
      appliedDate: Date.now()
    });
    await job.save();

    // Add to student's applied jobs
    student.appliedJobs.push({
      jobId: req.params.id,
      appliedDate: Date.now()
    });
    await student.save();

    res.json({ success: true, message: 'Successfully applied for job' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get job statistics
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('applications.student', 'branch');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const stats = {
      totalApplications: job.applications.length,
      branchWiseApplications: job.applications.reduce((acc, curr) => {
        const branch = curr.student.branch;
        acc[branch] = (acc[branch] || 0) + 1;
        return acc;
      }, {}),
      statusWiseCount: job.applications.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update job status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update application status
router.put('/:jobId/applications/:studentId', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Update job application status
    const job = await Job.findOneAndUpdate(
      {
        _id: req.params.jobId,
        'applications.student': req.params.studentId
      },
      {
        $set: {
          'applications.$.status': status
        }
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job or application not found' });
    }

    // Update student's application status
    await Student.findOneAndUpdate(
      {
        _id: req.params.studentId,
        'appliedJobs.jobId': req.params.jobId
      },
      {
        $set: {
          'appliedJobs.$.status': status
        }
      }
    );

    res.json(job);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;