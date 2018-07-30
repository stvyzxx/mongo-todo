const optionalRequire = require("optional-require")(require);
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const config = optionalRequire('./config/config');

const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { mongoose } = require('./db/mongoose');
const { authtenticate } = require('./middleware/authtenticate');

const port = process.env.PORT;

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('worrap');
});

app.get('/todos', authtenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then(todos => {
    res.send({ todos });
  }, e => {
    res.status(400).send(e); 
  });
});

app.post('/todos', authtenticate, (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then(doc => {
    res.send(doc);
  }, e => {
    res.status(400).send(e);
  });
});

app.get('/todos/:id', authtenticate, (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then(todo => {
    if (todo) {
      return res.send({ todo });
    }

    res.status(404).send();
  }, e => {
    res.status(400).send(e);  
  });
});

app.delete('/todos/:id', authtenticate, (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then(todo => {
    if (todo) {
      return res.status(200).send();
    }

    res.status(404).send();
  }, e => {
    res.status(404).send(e);
  });
});

app.patch('/todos/:id', authtenticate, (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({
    _id: id,
    _creator: req.user._id
  }, {$set: body}, {new: true}).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  })
});

app.post('/users', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);

  const user = new User(body);

  user.save()
    .then(() => user.generateAuthToken())
    .then(token => {
      res.header('x-auth', token).send(user)
    })
    .catch(e => {
      res.status(400).send(e);
    });
});

app.get('/users/me', authtenticate, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  console.log(body)
  User.findByCredentials(body.email, body.password)
    .then(user => {
      console.log('yrs')
      return user.generateAuthToken()
        .then(token => res.header('x-auth', token).send(user));
    })
    .catch(e => res.status(400).send());
}); 

app.delete('/user/me/token', authtenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});
