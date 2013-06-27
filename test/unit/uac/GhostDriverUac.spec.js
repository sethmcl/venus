/**
 * @author LinkedIn
 */
<<<<<<< HEAD
var expect         = require('expect.js'),
    GhostDriverUac = require('../../../lib/uac/GhostDriverUac'),
    http           = require('http');

describe('GhostDriverUac', function () {
=======
var expect        = require('expect.js'),
    PhantomUac    = require('../../../lib/uac/phantom'),
    http          = require('http');

describe('GhostDriverUac', function () {
  it('should load a webpage', function (done) {
    var browser = PhantomUac.create(), server, port;

    server = http.createServer( function( req, res ){
      res.end('');
      browser.shutdown();
      done();
    });

    server.listen();
    port = server.address().port;

    browser.runTest( 'http://localhost:' + port );
  });
>>>>>>> 41c8cbb4e815c8ab4ed674b981175e445e815303
});
