var v      = require('../../helpers');
var Config = v.r('Config');

describe('config', function () {
  var config;

  before(function () {
    config = new Config();
  });

  it('should return config context', function (done) {
    var testFile = v.path('fixtures', 'projects', 'project_a', 'test.spec.js');

    config.ctx(testFile)
      .then(function (ctx) {
        v.assert.deepEqual(ctx.get('includeGroup'), ['normal']);
        done();
      })
      .then(null, function (err) {
        done(err);
      });
  });
});
