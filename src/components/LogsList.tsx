import { useEffect, useState } from 'react';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path as needed

function LogsList() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Assuming 'farm001' is the specific farm ID you want to display logs for.
    // You might want to make this dynamic based on user selection or other logic.
    const logsRef = collection(db, 'farms', 'farm001', 'logs');
    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsData);
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, []);

  return (
    <div>
      <h2>Sensor Logs</h2>
      {logs.length === 0 ? (
        <p>No logs available.</p>
      ) : (
        <ul>
          {logs.map(log => (
            <li key={log.id}>
              Humidity: {log.humidity}, Temperature: {log.temperature}, Moisture: {log.moisture}, Updated: {log.last_updated?.toDate().toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LogsList;