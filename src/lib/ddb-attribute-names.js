// DDB attribute names are stored once per item, and count towards storage costs.
// The smaller attribute names are, the less we pay per item.
module.exports = {
  age: 'a',
  name: 'n',
  tags: 't',
  ttl: 'tl',
  userId: 'u',
};
