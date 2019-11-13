
/*
 * masterの参照を調べる
 * $ cat .git/refs/heads/master
 * 19b94fa331acbdb1e0b071728f63aedff8ca654d
 */

/*
 * 対象のオブジェクトを確認
 * $ ll .git/objects/19/b94fa331acbdb1e0b071728f63aedff8ca654d
 * -r--r--r--  1 satoruk  staff   129B 10 17 16:42 .git/objects/19/b94fa331acbdb1e0b071728f63aedff8ca654d
 */

/*
 * 対象のオブジェクトのタイプを確認
 * $ git cat-file -t 19b94fa331acbdb1e0b071728f63aedff8ca654d
 * commit
 */

/*
 * 対象のオブジェクトの内容を確認
 * $ git cat-file -p 19b94fa331acbdb1e0b071728f63aedff8ca654d
 * tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904
 * author satoruk <koyanagi3106@gmail.com> 1571298146 +0900
 * committer satoruk <koyanagi3106@gmail.com> 1571298146 +0900
 * 
 * first commit
 */


const fs = require('fs');
const zlib = require('zlib');
const isEqual = require('lodash/isEqual');

let targetObj;

function toGitObjectPath(objectId) {
  const dirName = objectId.substr(0,2);
  const fileName = objectId.substr(2);
  const filePath = `.git/objects/${dirName}/${fileName}`;
  return filePath;
}

function cat(filePath) {
  const data = fs.readFileSync(filePath).toString();
  return data.replace(/^\s+|\s+$/g, '');
}

function split(str, separator=',', limit=0) {
  if (limit <= 0) {
    return str.split(separator);
  }
  let tmp = str;
  const results = [];
  if (separator instanceof RegExp) {
    let flags = separator.flags;
    if (flags.indexOf('g') < 0) {
      flags += 'g';
    }
    const regex = new RegExp(separator, flags)
    const values = str.match(regex);
    if (!values) {
      return [str];
    }
    let i = 0;
    for (const value of values) {
      i++;
      if (i >= limit) {
        break;
      }
      const pos = tmp.indexOf(value);
      results.push(tmp.slice(0, pos));
      tmp = tmp.slice(pos + value.length);
    }
    results.push(tmp);
  } else {
    for (let i = 1; i < limit; i++) {
      const pos = tmp.indexOf(separator);
      if (pos < 0) {
        break;
      }
      results.push(tmp.slice(0, pos));
      tmp = tmp.slice(pos + separator.length);
    }
    results.push(tmp);
  }
  return results;
}
function testSplit(str, separator, limit, expected) {
  const actual = split(str, separator, limit);
  if (isEqual(actual, expected)) {
    console.log('\x1b[32m%s\x1b[0m', 'OK');
    return true;
  } else {
    console.error('\x1b[35m%s\x1b[0m', '  actual: ' + JSON.stringify(actual));
    console.error('\x1b[35m%s\x1b[0m', 'expected: ' + JSON.stringify(expected));
    return false;
  }
}

function gitCat(objectId) {
  const filePath = toGitObjectPath(objectId);
  const raw = zlib.unzipSync(fs.readFileSync(filePath)).toString();
  const [objectHeader, data] = split(raw, '\0', 2);
  const [type, contentSize] = split(objectHeader, ' ', 2);
  // console.log('-- data --');
  // console.log(typeof data);
  // console.log(data.length);
  // console.log(data);
  const [infoRaw, commitMessage] = split(data, '\n\n', 2);
  const info = split(infoRaw, '\n').reduce((acc, cur) => {
    const [k, v] = split(cur, ' ', 2);
    if (!acc.hasOwnProperty(k)) {
      acc[k] = [];
    }
    acc[k].push(v);
    return acc;
  }, {});
  const objectInfo = {
    type,
    contentSize,
    commitMessage,
    info
  };
  return objectInfo;
}


// testSplit('aa,bb,cc,dd', /,/, 2, ['aa', 'bb,cc,dd']);
// testSplit('aa,bb,cc,dd', /z/, 2, ['aa,bb,cc,dd']);
// testSplit('aa,bb,cc,dd', ',', 2, ['aa', 'bb,cc,dd']);
// testSplit('aa,bb,cc,dd', 'z', 2, ['aa,bb,cc,dd']);

const master = cat('.git/refs/heads/master');
console.log('master', master);
const objectInfo = gitCat(master);
console.log(master, objectInfo);
if (objectInfo.type == 'commit' && objectInfo.info.tree) {
  console.log('tree:', objectInfo.info.tree);
}
if (objectInfo.type == 'commit' && objectInfo.info.parent) {
  console.log('parent:', objectInfo.info.parent);
}
// gitCat('4b825dc642cb6eb9a060e54bf8d69288fbee4904')



