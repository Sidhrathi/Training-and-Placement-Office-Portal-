import React from 'react';
import { useParams } from 'react-router-dom';
import AddJobDrivePage from './AddJobDrivePage';

const EditJobDrivePage = () => {
    const { jobId } = useParams();
    return <AddJobDrivePage mode="edit" jobId={jobId} />;
};

export default EditJobDrivePage;

