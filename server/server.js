const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const { Todo } = require('./models/todo');

const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('worrap');
});

app.get('/todos', (req, res) => {
  res.send('from todos');
  // Todo.find().then(todos => {
  //   res.send({ todos });
  // }, e => {
  //   res.status(400).send(e); 
  // });
});

app.post('/todos', (req, res) => {
  const todo = new Todo({
    text: req.body.text
  });

  todo.save().then(doc => {
    res.send(doc);
  }, e => {
    res.status(400).send(e);
  });
});

app.get('/todos/:id', (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findById(id).then(todo => {
    if (todo) {
      return res.send({ todo });
    }

    res.status(404).send();
  }, e => {
    res.status(400).send(e);  
  });
});

app.listen(port, () => {
  console.log(JSON.stringify(process.env));
  console.log(`Started on port ${port}`);
});
