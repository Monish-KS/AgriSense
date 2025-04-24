import React from 'react';

const ProfilePage: React.FC = () => {
  return (
    <div>
      <h1>User Profile</h1>
      {/* Profile Navigation */}
      <nav>
        <ul>
          <li>Account Settings</li>
          <li>Privacy Settings</li>
          <li>Notification Settings</li>
          <li>Activity/History</li>
          <li>Connected Accounts</li>
        </ul>
      </nav>

      {/* Profile photo section */}
      <div>
        <h2>Profile Photo</h2>
        {/* Placeholder for profile photo */}
        <div style={{ width: '100px', height: '100px', backgroundColor: '#ccc', borderRadius: '50%' }}></div>
        {/* Buttons for edit, upload, remove */}
        <button>Edit Photo</button>
        <button>Upload Photo</button>
        <button>Remove Photo</button>
      </div>

      {/* Profile details section */}
      <div>
        <h2>Details</h2>
        <p>Phone Number: </p>
        <p>Email ID: </p>
        <p>Date of Birth: </p>
        <p>Age: </p>
        {/* Add other details here */}
      </div>
    </div>
  );
};

export default ProfilePage;