const express = require('express');
const cors = require('cors');
const { createHash } = require("node:crypto");
const app = express();
const port = 3001;

app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.urlencoded({ extended: true }));

let accessExpires= 0;
let refreshExpires = 0;
let loggedIn = true;

const updateToken = () => {
  accessExpires = Math.floor(Date.now() / 1000) + 60 * 3;
  refreshExpires = Math.floor(Date.now() / 1000) + 60 * 5;
};

updateToken();
setInterval(updateToken, 5000);

app.get('/', (req, res) => {
  res.send(`
    <h1>OAuth Monitor Example Server</h1>
    <p>User is currently <strong>${loggedIn ? 'Logged In' : 'Logged Out'}</strong></p>
    <form action="/toggle-login" method="post">
        <button type="submit">Toggle Login Status</button>
    </form>
  `);
})

app.post('/toggle-login', (req, res) => {
    loggedIn = !loggedIn;
    if (loggedIn) {
        updateToken();
    } else {
        accessExpires = 0;
        refreshExpires = 0;
    }
    res.redirect('/');
});

app.get('/oauth-monitor/user-status', (req, res) => {
  const userStatus = {
    loggedIn,
    accessExpires,
    refreshExpires,
    profile: loggedIn ? {
      displayName: 'Duckworth, Jean-Luc CTR (USA)',
      name: 'Duckworth, Jean-Luc CTR (USA)',
      email: 'jeanluc.duckworth.ctr@mail.mil',
      preferredUsername: 'jduckworth',
      sub: 'cac-id-1234567890',
      rankCode: 'CTR',
      branchOfServiceCode: 'A',
      dutyOrgCode: 'USA',
      company: 'DapperDuckling',
    } : undefined,
  };
  const payloadString = JSON.stringify(userStatus);

  res.json({
    checksum: createHash('md5').update(payloadString).digest('hex'),
    payload: userStatus,
    timestamp: Date.now(),
  });
});

app.get('/oauth2/userinfo', (req, res) => {
  if (!loggedIn) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  res.json({
    sub: 'cac-id-1234567890',
    name: 'Duckworth, Jean-Luc CTR (USA)',
    displayName: 'Duckworth, Jean-Luc CTR (USA)',
    email: 'jeanluc.duckworth.ctr@mail.mil',
    preferred_username: 'jduckworth',
    branchOfServiceCode: 'A',
    rankCode: 'CTR',
    dutyOrgCode: 'USA',
    company: 'DapperDuckling',
  });
});

app.get('/oauth-monitor/login', (req, res) => {
  loggedIn = true;
  updateToken();
  res.send('<script>window.close();</script>');
});

app.get('/oauth-monitor/logout', (req, res) => {
  // Simulated a roundtrip back to the app
  loggedIn = false;
  res.redirect('http://localhost:3000');
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
