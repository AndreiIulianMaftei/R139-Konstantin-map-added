const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const { spawn } = require('child_process');

app.post('/update-map', (req, res) => {
  console.log('Received request on /update-map');
  const layers = req.body;
  const scriptPath = path.join(__dirname, '../public/mapGeneration.py');

  console.log('Spawning Python:', scriptPath);
  const py = spawn('python', [scriptPath]);

  // Write the layers JSON to Python's stdin
  py.stdin.write(JSON.stringify(layers));
  py.stdin.end();

  let stdoutData = '';
  let stderrData = '';

  // Capture Python's stdout
  py.stdout.on('data', chunk => {
    stdoutData += chunk.toString();
  });

  // Capture Python's stderr
  py.stderr.on('data', chunk => {
    stderrData += chunk.toString();
  });

  // When Python exits...
  py.on('close', code => {
    console.log(`Python script exited with code ${code}`);
    if (code === 0) {
      return res.json({ success: true, message: 'Update received successfully' });;
    } else {
      console.error('Python stderr:', stderrData);
      return res
        .status(500)
        .json({ status: 'error', message: stderrData || `Exit code ${code}` });
    }
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
