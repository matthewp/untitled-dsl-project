const INSERTION = 'ins()';
//const memory = new WebAssembly.Memory({ initial: 1 });


/*const importObject = {
  env: { mem: memory }
};*/

const mod = await WebAssembly.instantiateStreaming(
  fetch(new URL('./dsl3.wasm', import.meta.url))
);

const {instance: {exports}} = mod;



/*
const buffer8 = new Uint8Array(memory.buffer);
const buffer32 = new Uint32Array(memory.buffer);

const eMem8 = buffer8.subarray(32768);
const eMem32 = buffer32.subarray(32768 >> 2);
*/



const $parse = exports.parse;
const $memory = exports.memory;

const buffer8 = new Uint8Array($memory.buffer);
const buffer32 = new Uint32Array($memory.buffer);

//const $callType = exports.callType;
//const $propertyType = exports.propertyType;

function writeToBuffer(value) {
  let enc = new TextEncoder();
  enc.encodeInto(value, buffer8);
}

function readFromBuffer(buffer, start, end) {
  let d = new TextDecoder();
  return d.decode(buffer.slice(start, end));
}

function debugPrintArray(ret) {
  console.log(ret);
  let ret32 = ret >> 2;
  let arr = buffer8.slice(ret, ret + 40);
  //arr = buffer32.slice(ret32, ret32 + 20);
  console.table(arr);
}

export function hash(str) {
  writeToBuffer(str);
  let hash = exports.hash(0, str.length);
  return hash;
}

export function debug(source, ...values) {
  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  let len = raw.length;
  let ret = $parse(0, source.len);
  ret = $parse(ret, source.len);
  let l = 'n';

  /*let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);

  let limit = 15;

  let idx = 0;
  let len = raw.length;
  let ret;

  while(true) {
    ret = $parse(idx, len);
    let ret32 = ret >> 2;
    idx = buffer32[ret32];

    let out = {
      byteIndex: idx,
      holeIndex: buffer32[ret32 + 1],
      tag: buffer8[ret + 8],
    };

    switch(out.tag) {
      case 0: {
        out.tagName = 'EOF';
        break;
      }
      case 1: {
        Object.assign(out, {
          tagName: 'RuleStart',
          selectorStart: buffer32[ret32 + 2] >> 8,
          selectorEnd: buffer32[ret32 + 3] >> 8,
          selector: readFromBuffer(buffer8, buffer32[ret32 + 2] >> 8, buffer32[ret32 + 3] >> 8)
        });
        break;
      }
      case 2: {
        Object.assign(out, {
          tagName: 'Property',
          selectorStart: buffer32[ret32 + 2] >> 8,
          selectorEnd: buffer32[ret32 + 3] >> 8,
          selector: readFromBuffer(buffer8, buffer32[ret32 + 2] >> 8, buffer32[ret32 + 3] >> 8),
          propertyStart: buffer32[ret32 + 4] >> 8,
          propertyEnd: buffer32[ret32 + 5] >> 8,
          property: readFromBuffer(buffer8, buffer32[ret32 + 4] >> 8, buffer32[ret32 + 5] >> 8),
          valueType: buffer8[ret + 25]
        });
        switch(out.valueType) {
          case 1:
            out.valueTypeName = 'Insertion';
            out.valueIndex = buffer8[ret + 26];
            break;
          case 2:
            out.valueTypeName = 'String';
            break;
          case 3:
            out.valueTypeName = 'Identifier';
            out.identifierStart = buffer32[ret32 + 7];
            out.identifierEnd = buffer32[ret32 + 7] + 3; // TODO made up
            out.identifier = readFromBuffer(buffer8, buffer32[ret32 + 7], buffer32[ret32 + 7] + 3);
            out.callType = $callType(out.identifierStart, out.identifierEnd);
            break;
          case 9:
            out.valueTypeName = 'Unknown';
            break;
        }
      }
    }

    //debugPrintArray(ret);
    console.table(out);

    if(out.tag === 0)
      break;
    else if(limit === 0)
      break;
    else
      limit--;
  }
  */
}

export function tokenize(source, values, cb) {
  let holes = values.map(_ => INSERTION);
  let raw = String.raw(source, ...holes);
  writeToBuffer(raw);

  let idx = 0;
  let len = raw.length;
  let ret;

  while(true) {
    ret = $parse(idx, len);
    idx = buffer32[ret >> 2];
    if(buffer8[ret + 8] === 0)
      break;

    cb(eMem8, eMem32);
  }
}

// Reading
export const readSelector = () => readFromBuffer(buffer8, eMem32[2] >> 8, eMem32[3] >> 8);
export const readValueType = () => eMem8[25];
export const readPropertyType = () => $propertyType(eMem32[4] >> 8, eMem32[5] >> 8);

export const readInsertionValueIndex = () => eMem8[26];