var assert = require('assert');

var urlExists = require('..');

urlExists('https://www.google.com', function(err, exists) {
  assert(exists === true);

  urlExists('https://google.com', function(err, exists) {
    assert(exists === true);

    urlExists('http://www.google.com', function(err, exists) {
      assert(exists === true);

      urlExists('https://www.asdflkasdfljalsfdjasfdljklsjafasdfljjkasfdsafdljfdsaljakljsdljksafasfdlk.lasjkd', function(err, exists) {
        assert(exists === false);

        console.log('All tests pass!');
        process.exit(0);
      });
    });
  });
});
