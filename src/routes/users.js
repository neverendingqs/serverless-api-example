'use strict';
const express = require('express');

const router = express.Router();

router.get('/:id', function (req, res) {
  const id = req.params.id;

  res.json({
    id,
    name: `name-of-${id}`,
    age: 20,
    tags: ['programmer'],
  })
});

module.exports = router;
