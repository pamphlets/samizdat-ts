var test = require('tape')
var util = require('../util')

test('validate input string as database key', function (t) {
  t.ok(util.validateKey('456dst7z5/entry/000000000'), 'basic entry correctly validated')
  t.ok(util.validateKey('456dst7z5/multi/level/000000000'), 'multi-level entry correctly validated')

  t.notOk(util.validateKey('456dst7z5//000000000'), 'catches empty entry id')
  t.notOk(util.validateKey('456dst7z5/000000000'), 'catches missing entry id')
  t.notOk(util.validateKey('entry/000000000'), 'catches missing update timestamp')
  t.notOk(util.validateKey('456dst7z5/entry'), 'catches missing ancestor timestamp')
  t.notOk(util.validateKey('000000000/entry/000000000'), 'catches wrongly encoded creation timestamp')
  t.end()
})

test('extract entry id from database key', function (t) {
  ['456dst7z5/entry/000000000', '456dst7z5/multi/level/000000000'].forEach(function (key) {
    var id = util.getId(key)

    t.ok(id.length > 0, key + ': returned non-empty id')
    t.ok(key.includes(id), key + ': found id inside database key')
  })

  t.end()
})

test('extract entry creation date from key', function (t) {
  var now = Date.now()
  var key = util.newKey('entry')
  var date = util.getDate(key)

  t.equals(date.getTime(), now, 'extract accurate time from database key')
  t.end()
})

test('extract ancestor timestamp from key', function (t) {
  var key = '214ffg781/key/2130bser0'

  t.equals(util.getPrev(key), '2130bser0', 'extract correct ancestor timestamp from key')
  t.end()
})

test('create new database key from entry id', function (t) {
  ['entry', 'multi/level'].forEach(function (id) {
    var key = util.newKey(id)
    var splitKey = key.split('/')
    var splitId = id.split('/')

    for (var i = 0; i < splitId.length; i++) {
      t.equal(splitId[i], splitKey[i + 1], `${id}: part ${i + 1} of id corresponds to key`)
    }
    t.equal(splitId.length, splitKey.length - 2, id + ': key has correct number of slash-seperated parts')

    var testTime = Date.now()
    var keyTime =  new Date(parseInt(splitKey[0], 33))
    t.ok(keyTime > testTime - 5, id + ': first part of key should display present time')
    t.ok(util.validateKey(key), id + ': generated key is valid')
  })

  t.end()
})

test('create database key for updated entry', function (t)  {
  ['456dst7z5/entry/000000000', '456dst7z5/multi/level/000000000'].forEach(function (prev) {
    var key = util.updateKey(prev)
    var splitKey = key.split('/')
    var splitPrev = prev.split('/')

    for (var i = 1; i < splitPrev.length - 1; i++) {
      t.equal(splitPrev[i], splitKey[i], `${prev}: part ${i} of id corresponds in both keys`)
    }
    t.equal(splitPrev.length, splitKey.length, prev + ': both keys have same number of slash-seperated parts')
    t.equal(splitPrev[0], splitKey[splitKey.length - 1], prev + ': last part of new key should be timestamp of original key')

    var testTime = Date.now()
    var keyTime =  new Date(parseInt(splitKey[0], 33))
    t.ok(keyTime > testTime - 5, prev + ': first part of key should display present time')
    t.ok(util.validateKey(key), prev + ': generated key is valid')
  })

  t.end()
})