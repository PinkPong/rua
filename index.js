const chalk = require('chalk');
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const port = 3131;
const userSource = 'https://randomuser.me/api';
const app = express();
app.use(bodyParser.json());

let userStore ;
let fnCache;

const init = () => {
  userStore = [];
  fnCache = {};
  let ctr = 10;
  while (ctr-- > 0) {
    loadUser().then(user => addUser(user));
  }
};

const addUser = (userData, postData) => {
  try {
    const { gender, name: { first }, location: { city }, email, cell } = userData;
    const { length } = userStore;
    fnCache = {...fnCache, [first]: fnCache[first] ? [...fnCache[first], length] : [length]  };
    userStore = [...userStore, { gender, firstname: first, city, email, cell }];
  } catch (e) {
    console.error('error loading user');
    throw e;
  }
}

const loadUser = (uri = userSource) => {
  return fetch(uri)
  .then(res => res.json())
  .then(json => json.results ? json.results[0] : {} )
  .catch(err => console.error(err));
}

app.get('/', function (req, res) {
  const { length } = userStore;
  length > 0 ?
    res.send(`hey, we have ${length} user, try /users or /user/firstname/userFrstName to check our records!..`) :
    res.send('nobody home, try later');
});

app.get('/users', function (req, res) {
  res.status(200);
  res.send(JSON.stringify(userStore))
});

app.post('/users', function(req, res) {
  const { gender, firstname, city, email, cell } = req.body;
  addUser({
    gender,
    name: { first: firstname },
    location: { city },
    email,
    cell
  });
  res.status(201);
  res.send(JSON.stringify({ message: 'User successfully created!' }));
});

app.get('/users/firstname/:firstname', function (req, res) {
  const { params: { firstname }} = req;
  if (fnCache[firstname]) {
    res.status(200);
    res.send(JSON.stringify(userStore.filter(user => user.firstname === firstname)));
    return;
  }
  res.status(404);
  res.send(JSON.stringify({ message: 'User not found! '}));
})

app.listen(port, () => {
  init();
  console.info(`Server started ${chalk.green('✓')}`);
  console.info(`Server running at: ${chalk.magenta(`http://localhost:${port}`)}`);
});
