import axios from 'axios';

async function testRemotive() {
  try {
      const response = await axios.get('https://remotive.com/api/remote-jobs', {
      params: {
        category: 'backend',
      },
      timeout: 10000,
    });
    const jobs = response.data.jobs || [];
    console.log(`Remotive jobs fetched: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log('Sample job:', jobs[0]);
    } else {
      console.log('No jobs returned from Remotive.');
    }
  } catch (error) {
    console.error('Remotive fetch error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testRemotive();
